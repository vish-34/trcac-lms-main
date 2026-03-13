import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";
import DCTeacher from "../models/DCTeacher.js";
import JCTeacher from "../models/JCTeacher.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to generate class name from degree and year
const generateClassName = (degree, year) => {
  const degreeMap = {
    'B.Sc (CS)': 'BScCS',
    'B.Sc (IT)': 'BScIT',
    'BMS': 'BMS',
    'BCom': 'BCom',
    'BAF': 'BAF',
    'BA': 'BA',
    'BAMMC': 'BAMMC'
  };
  
  const shortDegree = degreeMap[degree] || 'BScCS';
  return `${year}${shortDegree}`;
};

// Helper function to generate semester from year
const generateSemester = (year) => {
  switch(year) {
    case 'FY': return 1;
    case 'SY': return 3;
    case 'TY': return 5;
    default: return 1;
  }
};

// Helper function to generate JC class name from stream and year
const generateJCClassName = (stream, year) => {
  return `${year}JC`;
};

// Helper function to generate JC semester from year
const generateJCSemester = (year) => {
  switch(year) {
    case 'FY': return 1;
    case 'SY': return 2;
    default: return 1;
  }
};
// Helper function to generate password from first name
const generatePasswordFromName = (fullName) => {
  if (!fullName) return "password123";
  
  // Extract first name
  const firstName = fullName.split(' ')[0].toLowerCase();
  
  // Simplify: remove special characters, keep only letters
  const simplified = firstName.replace(/[^a-z]/g, '');
  
  // Generate password: simplified name + 3-digit random number
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${simplified}${randomSuffix}`;
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ======================
// BULK ENROLLMENT ENDPOINT
// ======================
router.post("/bulk-enroll", upload.single('file'), async (req, res) => {
  try {
    console.log('=== BULK ENROLLMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { userType, collegeType } = req.body; // 'student' or 'teacher', 'degree' or 'junior'
    console.log('User type:', userType);
    console.log('College type:', collegeType);
    
    const enrolledUsers = [];
    const errors = [];

    if (req.file) {
      // Process CSV file
      const filePath = req.file.path;
      console.log('Processing file:', filePath);
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          console.log('CSV row data:', data);
          results.push(data);
        })
        .on('end', async () => {
          console.log(`Processing ${results.length} users from CSV`);
          console.log('CSV data:', results);
          
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            console.log(`\n--- Processing Row ${i + 1} ---`);
            console.log('Row data:', row);
            
            try {
              // Validate required fields
              if (!row.fullName || !row.email) {
                const errorMsg = `Row ${i + 1}: Missing fullName or email`;
                console.log('Validation error:', errorMsg);
                errors.push(errorMsg);
                continue;
              }

              if (userType === 'student' && !row.rollNo?.trim()) {
                const errorMsg = `Row ${i + 1}: Missing rollNo`;
                console.log('Validation error:', errorMsg);
                errors.push(errorMsg);
                continue;
              }
              
              if (!isValidEmail(row.email)) {
                const errorMsg = `Row ${i + 1}: Invalid email format - ${row.email}`;
                console.log('Email validation error:', errorMsg);
                errors.push(errorMsg);
                continue;
              }
              
              // Generate password from first name
              const password = generatePasswordFromName(row.fullName);
              console.log('Generated password:', password);
              const hashedPassword = await bcrypt.hash(password, 10);
              
              const userData = {
                fullName: row.fullName.trim(),
                email: row.email.trim().toLowerCase(),
                password: hashedPassword,
                originalPassword: password, // Store original for profile editing
                role: userType,
                rollNo: userType === 'student' ? row.rollNo.trim() : undefined,
                collegeType: collegeType, // Add college type
                createdAt: new Date(),
                isActive: true
              };
              
              console.log('User data to create:', userData);
              
              // Add student/teacher specific fields
              if (userType === 'student') {
                userData.degree = row.degree || '';
                userData.year = row.year || 'FY';
                
                if (collegeType === 'degree') {
                  // Generate class and semester for DC students
                  userData.class = generateClassName(userData.degree, userData.year);
                  userData.semester = generateSemester(userData.year);
                  userData.college = 'Degree College';
                  console.log('DC Student class:', userData.class);
                  console.log('DC Student semester:', userData.semester);
                } else {
                  // For JC students, we need stream instead of degree
                  userData.stream = row.stream || 'Commerce'; // Default to Commerce
                  userData.class = generateJCClassName(userData.stream, userData.year);
                  userData.semester = generateJCSemester(userData.year);
                  userData.college = 'Junior College';
                  console.log('JC Student stream:', userData.stream);
                  console.log('JC Student class:', userData.class);
                  console.log('JC Student semester:', userData.semester);
                }
                console.log('Student data:', userData);
              } else if (userType === 'teacher') {
                userData.subjects = row.subjects ? row.subjects.split(',').map(s => s.trim()) : [];
                userData.employeeId = row.employeeId || '';
                
                if (collegeType === 'degree') {
                  userData.college = 'Degree College';
                } else {
                  userData.college = 'Junior College';
                }
                console.log('Teacher data:', userData);
              }
              
              // Check for existing user and create
              let existingUser = null;
              if (userType === 'student') {
                // Check based on college type
                if (collegeType === 'degree') {
                  console.log('Checking DCStudent for email:', userData.email);
                  existingUser = await DCStudent.findOne({ email: userData.email });
                  if (!existingUser) {
                    console.log('Creating new DCStudent');
                    const newUser = new DCStudent(userData);
                    await newUser.save();
                    enrolledUsers.push({ ...userData, id: newUser._id });
                    console.log('DCStudent created successfully');
                  } else {
                    console.log('DCStudent already exists');
                  }
                } else {
                  console.log('Checking JCStudent for email:', userData.email);
                  existingUser = await JCStudent.findOne({ email: userData.email });
                  if (!existingUser) {
                    console.log('Creating new JCStudent');
                    const newUser = new JCStudent(userData);
                    await newUser.save();
                    enrolledUsers.push({ ...userData, id: newUser._id });
                    console.log('JCStudent created successfully');
                  } else {
                    console.log('JCStudent already exists');
                  }
                }
              } else if (userType === 'teacher') {
                // Check based on college type
                if (collegeType === 'degree') {
                  console.log('Checking DCTeacher for email:', userData.email);
                  existingUser = await DCTeacher.findOne({ email: userData.email });
                  if (!existingUser) {
                    console.log('Creating new DCTeacher');
                    const newUser = new DCTeacher(userData);
                    await newUser.save();
                    enrolledUsers.push({ ...userData, id: newUser._id });
                    console.log('DCTeacher created successfully');
                  } else {
                    console.log('DCTeacher already exists');
                  }
                } else {
                  console.log('Checking JCTeacher for email:', userData.email);
                  existingUser = await JCTeacher.findOne({ email: userData.email });
                  if (!existingUser) {
                    console.log('Creating new JCTeacher');
                    const newUser = new JCTeacher(userData);
                    await newUser.save();
                    enrolledUsers.push({ ...userData, id: newUser._id });
                    console.log('JCTeacher created successfully');
                  } else {
                    console.log('JCTeacher already exists');
                  }
                }
              }
              
              if (existingUser) {
                const errorMsg = `Row ${i + 1}: User already exists - ${row.email}`;
                console.log('User exists error:', errorMsg);
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
          console.log('Enrolled users:', enrolledUsers.length);
          console.log('Errors:', errors.length);
          console.log('Error details:', errors);
          
          // Clean up uploaded file
          fs.unlinkSync(filePath);
          
          res.json({
            success: true,
            message: `Bulk enrollment completed`,
            enrolled: enrolledUsers.length,
            errors: errors.length,
            errorDetails: errors,
            users: enrolledUsers.map(u => ({
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              rollNo: u.rollNo,
              password: u.originalPassword,
              role: u.role,
              collegeType: u.collegeType
            }))
          });
          
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          res.status(400).json({
            success: false,
            message: "Error parsing CSV file",
            error: error.message
          });
        });
        
    } else {
      console.log('No file uploaded');
      res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    
  } catch (error) {
    console.error('Bulk enrollment error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk enrollment",
      error: error.message
    });
  }
});

// ======================
// MANUAL ENROLLMENT ENDPOINT
// ======================
router.post("/manual-enroll", async (req, res) => {
  try {
    const { userType, collegeType, users } = req.body; // Array of user objects
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No users provided"
      });
    }
    
    const enrolledUsers = [];
    const errors = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      try {
        // Validate required fields
        if (!user.fullName || !user.email) {
          errors.push(`User ${i + 1}: Missing fullName or email`);
          continue;
        }

        if (userType === 'student' && !user.rollNo?.trim()) {
          errors.push(`User ${i + 1}: Missing rollNo`);
          continue;
        }
        
        if (!isValidEmail(user.email)) {
          errors.push(`User ${i + 1}: Invalid email format - ${user.email}`);
          continue;
        }
        
        // Generate password from first name
        const password = generatePasswordFromName(user.fullName);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
          fullName: user.fullName.trim(),
          email: user.email.trim().toLowerCase(),
          password: hashedPassword,
          originalPassword: password,
          role: userType,
          rollNo: userType === 'student' ? user.rollNo.trim() : undefined,
          collegeType: collegeType, // Add college type
          createdAt: new Date(),
          isActive: true
        };
        
        // Add role-specific fields
        if (userType === 'student') {
          userData.degree = user.degree || '';
          userData.year = user.year || 'FY';
        } else if (userType === 'teacher') {
          userData.subjects = user.subjects || [];
          userData.employeeId = user.employeeId || '';
        }
        
        // Check for existing user and create
        let existingUser = null;
        if (userType === 'student') {
          // Check based on college type
          if (collegeType === 'degree') {
            existingUser = await DCStudent.findOne({ email: userData.email });
            if (!existingUser) {
              const newUser = new DCStudent(userData);
              await newUser.save();
              enrolledUsers.push({ ...userData, id: newUser._id });
            }
          } else {
            existingUser = await JCStudent.findOne({ email: userData.email });
            if (!existingUser) {
              const newUser = new JCStudent(userData);
              await newUser.save();
              enrolledUsers.push({ ...userData, id: newUser._id });
            }
          }
        } else if (userType === 'teacher') {
          // Check based on college type
          if (collegeType === 'degree') {
            existingUser = await DCTeacher.findOne({ email: userData.email });
            if (!existingUser) {
              const newUser = new DCTeacher(userData);
              await newUser.save();
              enrolledUsers.push({ ...userData, id: newUser._id });
            }
          } else {
            existingUser = await JCTeacher.findOne({ email: userData.email });
            if (!existingUser) {
              const newUser = new JCTeacher(userData);
              await newUser.save();
              enrolledUsers.push({ ...userData, id: newUser._id });
            }
          }
        }
        
        if (existingUser) {
          errors.push(`User ${i + 1}: Already exists - ${user.email}`);
        }
        
      } catch (error) {
        console.error(`Error processing user ${i + 1}:`, error);
        errors.push(`User ${i + 1}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `Manual enrollment completed`,
      enrolled: enrolledUsers.length,
      errors: errors.length,
      errorDetails: errors,
      users: enrolledUsers.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        rollNo: u.rollNo,
        password: u.originalPassword,
        role: u.role
      }))
    });
    
  } catch (error) {
    console.error('Manual enrollment error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during manual enrollment",
      error: error.message
    });
  }
});

// ======================
// GET ENROLLMENT TEMPLATES
// ======================
router.get("/templates", (req, res) => {
  res.json({
    studentTemplate: {
      fullName: "John Doe",
      email: "john.doe@example.com",
      rollNo: "23CS101",
      degree: "B.Sc (CS)",
      year: "SY",
      stream: "Commerce", // For JC students
      collegeType: "degree"
    },
    teacherTemplate: {
      fullName: "Jane Smith",
      email: "jane.smith@example.com",
      subjects: "Mathematics, Physics",
      employeeId: "EMP001",
      collegeType: "degree"
    },
    csvFormat: {
      students: {
        degree: "fullName,email,rollNo,degree,year,collegeType",
        junior: "fullName,email,rollNo,stream,year,collegeType"
      },
      teachers: "fullName,email,subjects,employeeId,collegeType"
    }
  });
});

export default router;
