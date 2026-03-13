import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import ExcelJS from 'exceljs';
import Subject from "../models/Subject.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to validate if uploaded file is actually a CSV or Excel
const validateCSVFile = (file) => {
  if (!file) return false;

  // Check file extension
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const validExtensions = ['csv', 'xlsx', 'xls'];

  if (!validExtensions.includes(fileExtension)) {
    return false;
  }

  // Check MIME type
  const validMimeTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  if (!validMimeTypes.includes(file.mimetype)) {
    return false;
  }

  return true;
};

// Helper function to detect if file is actually a CSV
const isValidCSV = (data) => {
  // Simple validation - just check if it's an object with required fields
  if (!data || typeof data !== 'object') {
    console.log('❌ Invalid data type or empty data');
    return false;
  }

  // Check for required fields
  const hasSubjectName = 'subjectName' in data;
  const hasSubjectCode = 'subjectCode' in data;
  const hasCourseCredits = 'courseCredits' in data;

  console.log('🔍 CSV Keys found:', Object.keys(data));
  console.log('🔍 Has subjectName:', hasSubjectName);
  console.log('🔍 Has subjectCode:', hasSubjectCode);
  console.log('🔍 Has courseCredits:', hasCourseCredits);
  console.log('🔍 Final validation result:', hasSubjectName && hasSubjectCode && hasCourseCredits);

  return hasSubjectName && hasSubjectCode && hasCourseCredits;
};

// Helper function to clean CSV data
const cleanCSVData = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (key && typeof key === 'string' && value && typeof value === 'string') {
      // Remove null bytes and clean's string
      cleaned[key] = value
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim();
    } else if (key && typeof key === 'string' && value && typeof value === 'number') {
      // Handle numeric values (like courseCredits)
      cleaned[key] = value;
    } else if (key && typeof key === 'string' && value !== null && value !== undefined) {
      // Handle other types (boolean, etc.)
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Helper function to process uploaded file (CSV or Excel)
const processUploadedFile = (filePath, originalName) => {
  return new Promise((resolve, reject) => {
    const fileExtension = originalName.split('.').pop().toLowerCase();
    const results = [];

    if (fileExtension === 'csv') {
      fs.createReadStream(filePath)
        .pipe(csv({
          // This ensures headers are trimmed and special characters (like BOM) are removed
          mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
        }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // FIXED: Correct way to read Excel using exceljs
      const workbook = new ExcelJS.Workbook();
      workbook.xlsx.readFile(filePath)
        .then(() => {
          const worksheet = workbook.getWorksheet(1); // Get first sheet
          const excelResults = [];

          // Get headers from first row
          const headers = [];
          worksheet.getRow(1).eachCell((cell) => {
            headers.push(cell.value ? cell.value.toString().trim() : '');
          });

          // Process data rows
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              rowData[headers[colNumber - 1]] = cell.value;
            });
            excelResults.push(rowData);
          });
          resolve(excelResults);
        })
        .catch(reject);
    } else {
      reject(new Error('Unsupported file format'));
    }
  });
};

// ======================
// BULK SUBJECT ENROLLMENT ENDPOINT
// ======================
router.post("/bulk-enroll", upload.single('file'), async (req, res) => {
  try {
    console.log('=== BULK SUBJECT ENROLLMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { year, semester, department, collegeType } = req.body;
    console.log('Year:', year);
    console.log('Semester:', semester);
    console.log('Department:', department);
    console.log('College Type:', collegeType);

    // Validate uploaded file
    if (!req.file) {
      console.log('No file uploaded');
      res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
      return;
    }

    // Check if file is actually a CSV
    if (!validateCSVFile(req.file)) {
      console.log('Invalid file type:', req.file.originalname, req.file.mimetype);
      res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload a CSV file.",
        details: `File: ${req.file.originalname}, Type: ${req.file.mimetype}`
      });
      return;
    }

    const enrolledSubjects = [];
    const errors = [];

    if (req.file) {
      // Process uploaded file (CSV or Excel)
      const filePath = req.file.path;
      console.log('Processing file:', filePath);

      try {
        const results = await processUploadedFile(filePath, req.file.originalname);
        console.log(`Processing ${results.length} subjects from file`);
        console.log('File data:', results);

        for (let i = 0; i < results.length; i++) {
          // Use your cleaning helper here!
          const row = cleanCSVData(results[i]);
          console.log(`\n--- Processing Row ${i + 1} ---`);
          console.log('Row data:', row);

          try {
            // Validate required fields
            if (!row.subjectName) {
              const errorMsg = `Row ${i + 1}: Missing subjectName`;
              console.log('❌ Validation error:', errorMsg);
              errors.push(errorMsg);
              continue;
            }

            console.log('✅ Processing subject:', row.subjectName);

            // Get vertical from CSV (can be empty for non-degree)
            let vertical = null;
            if (collegeType === 'degree' && row.vertical) {
              vertical = parseInt(row.vertical);
              if (isNaN(vertical) || vertical < 1 || vertical > 6) {
                const errorMsg = `Row ${i + 1}: Invalid vertical number - ${row.vertical}. Must be 1-6`;
                console.log('❌ Vertical validation error:', errorMsg);
                errors.push(errorMsg);
                continue;
              }
            }

            // Create subject data with String() conversion for safety
            const subjectData = {
              collegeType: collegeType,
              year: year,
              semester: semester,
              courseOrStream: department.trim(),
              subjectName: String(row.subjectName).trim(), // Added String()
              subjectCode: String(row.subjectCode).trim(), // Added String()
              courseCredits: row.courseCredits ? parseInt(row.courseCredits) || 1 : 1, // Default to 1 if invalid
              ...(vertical && { vertical: vertical }) // Only add vertical if valid
            };

            console.log('🔧 Subject data to create:', subjectData);

            // Check for existing subject - more flexible check
            const existingSubject = await Subject.findOne({
              collegeType: subjectData.collegeType,
              year: subjectData.year,
              semester: subjectData.semester,
              courseOrStream: subjectData.courseOrStream,
              subjectName: subjectData.subjectName,
              ...(vertical && { vertical: vertical })
            });

            if (!existingSubject) {
              try {
                console.log('Creating new subject');
                const newSubject = new Subject(subjectData);
                await newSubject.save();
                enrolledSubjects.push({ ...subjectData, id: newSubject._id });
                console.log('Subject created successfully');
              } catch (createError) {
                if (createError.code === 11000) {
                  // Handle duplicate key error gracefully
                  const errorMsg = `Row ${i + 1}: Subject already exists - ${row.subjectName}`;
                  console.log('Duplicate key caught:', errorMsg);
                  errors.push(errorMsg);
                } else {
                  console.error(`Error creating subject ${i + 1}:`, createError);
                  const errorMsg = `Row ${i + 1}: Processing error - ${createError.message}`;
                  console.log('Processing error:', errorMsg);
                  errors.push(errorMsg);
                }
              }
            } else {
              const errorMsg = `Row ${i + 1}: Subject already exists - ${row.subjectName}`;
              console.log('Subject exists error:', errorMsg);
              errors.push(errorMsg);
            }

          } catch (error) {
            console.error(`Error processing row ${i + 1}:`, error);
            const errorMsg = `Row ${i + 1}: Processing error - ${error.message}`;
            console.log('Processing error:', errorMsg);
            errors.push(errorMsg);
          }
        }

        console.log('\n=== FINAL RESULTS ===');
        console.log('Enrolled subjects:', enrolledSubjects.length);
        console.log('Errors:', errors.length);
        console.log('Error details:', errors);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          message: `Bulk subject enrollment completed`,
          enrolled: enrolledSubjects.length,
          errors: errors.length,
          errorDetails: errors,
          subjects: enrolledSubjects
        });

      } catch (error) {
        console.error('File processing error:', error);
        res.status(400).json({
          success: false,
          message: "Error processing file",
          error: error.message
        });
      }
    } else {
      console.log('No file uploaded');
      res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
  } catch (error) {
    console.error('Bulk subject enrollment error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk subject enrollment",
      error: error.message
    });
  }
});

// ======================
// GET SUBJECT ENROLLMENT TEMPLATES
// ======================
router.get("/templates", (req, res) => {
  res.json({
    subjectTemplate: {
      subjectName: "Mathematics",
      vertical: "1" // Optional for degree college
    },
    csvFormat: {
      degree: "subjectName,vertical",
      junior: "subjectName"
    }
  });
});

export default router;
