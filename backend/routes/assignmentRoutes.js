import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Assignment from "../models/Assignment.js";

// Security imports
import { 
  validateAssignmentCreation, 
  validateMongoId, 
  handleValidationErrors,
  fileFilter, 
  fileLimits 
} from "../middleware/security.js";

// Helper function to map assignment class to degree and year
const mapClassToDegreeYear = (className) => {
  const classMappings = {
    // Degree College mappings
    'FYBScCS': { degree: 'B.Sc (CS)', year: 'FY' },
    'SYBScCS': { degree: 'B.Sc (CS)', year: 'SY' },
    'TYBScCS': { degree: 'B.Sc (CS)', year: 'TY' },
    'FYBMS': { degree: 'BMS', year: 'FY' },
    'SYBMS': { degree: 'BMS', year: 'SY' },
    'TYBMS': { degree: 'BMS', year: 'TY' },
    'FYBCom': { degree: 'BCom', year: 'FY' },
    'SYBCom': { degree: 'BCom', year: 'SY' },
    'TYBCom': { degree: 'BCom', year: 'TY' },
    'FYBAF': { degree: 'BAF', year: 'FY' },
    'SYBAF': { degree: 'BAF', year: 'SY' },
    'TYBAF': { degree: 'BAF', year: 'TY' },
    
    // Junior College mappings
    'FYJC': { stream: 'Commerce', year: 'FY' },
    'SYJC': { stream: 'Commerce', year: 'SY' },
    'FYJC-Arts': { stream: 'Arts', year: 'FY' },
    'SYJC-Arts': { stream: 'Arts', year: 'SY' }
  };
  
  return classMappings[className] || null;
};

// Helper function to generate class name from degree/year
const generateClassName = (degree, year) => {
  const degreeMappings = {
    'B.Sc (CS)': 'BScCS',
    'BMS': 'BMS',
    'BCom': 'BCom',
    'BAF': 'BAF'
  };
  
  const degreeCode = degreeMappings[degree];
  if (!degreeCode) return null;
  
  return `${year}${degreeCode}`;
};

// Helper function to generate JC class name from stream/year
const generateJCClassName = (stream, year) => {
  return stream === 'Arts' ? `${year}JC-Arts` : `${year}JC`;
};

// Normalize class name to match backend format
const normalizeClassName = (className) => {
  const classMappings = {
    // Handle common variations
    'sybsccs': 'SYBScCS',
    'fybsccs': 'FYBScCS',
    'tybsccs': 'TYBScCS',
    'fybms': 'FYBMS',
    'sybms': 'SYBMS',
    'tybms': 'TYBMS',
    'fybcom': 'FYBCom',
    'sybcom': 'SYBCom',
    'tybcom': 'TYBCom',
    'fybaf': 'FYBAF',
    'sybaf': 'SYBAF',
    'tybaf': 'TYBAF',
    'fyjc': 'FYJC',
    'syjc': 'SYJC'
  };
  
  // First check if it's already in correct format
  const validClasses = [
    "FYJC", "SYJC",
    "FYBScCS", "SYBScCS", "TYBScCS",
    "FYBMS", "SYBMS", "TYBMS",
    "FYBCom", "SYBCom", "TYBCom",
    "FYBAF", "SYBAF", "TYBAF",
    "FY", "SY", "TY"
  ];
  
  if (validClasses.includes(className)) {
    return className;
  }
  
  // Try to map lowercase variations
  const lowerCase = className.toLowerCase();
  return classMappings[lowerCase] || className;
};

const router = express.Router();

// Configure multer for file uploads with security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "assignments");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${timestamp}_${randomString}_${originalName}`;
    cb(null, filename);
  }
});

// Secure upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: fileLimits
});

// Configure multer for submission uploads
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "submissions");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const submissionUpload = multer({
  storage: submissionStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ======================
// CREATE ASSIGNMENT (TEACHER)
// ======================
router.post("/create", upload.single("assignmentFile"), async (req, res) => {
  try {
    console.log('Assignment creation request received');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const {
      title,
      description,
      subject,
      teacherId,
      teacherName,
      deadline,
      class: className,
      college
    } = req.body;

    console.log('Parsed data:', {
      title,
      description,
      subject,
      teacherId,
      teacherName,
      deadline,
      className,
      college
    });

    // Normalize class name to handle case sensitivity
    const normalizedClass = normalizeClassName(className);
    console.log('Normalized class name:', normalizedClass, '(from:', className, ')');

    // Validation
    if (!title || !subject || !teacherId || !teacherName || !deadline || !className || !college) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ 
        message: "All required fields must be provided",
        missing: {
          title: !title,
          subject: !subject,
          teacherId: !teacherId,
          teacherName: !teacherName,
          deadline: !deadline,
          className: !className,
          college: !college
        }
      });
    }

    if (!req.file) {
      console.log('Validation failed - no file uploaded');
      return res.status(400).json({ message: "Assignment file is required" });
    }

    // Parse deadline
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      console.log('Validation failed - invalid deadline format');
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    console.log('Creating assignment with data:', {
      title: title.trim(),
      description: description?.trim() || "",
      subject: subject.trim(),
      teacherId,
      teacherName: teacherName.trim(),
      deadline: deadlineDate,
      class: normalizedClass.trim(),
      college,
      fileUrl: `/uploads/assignments/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    // Create assignment
    const assignment = new Assignment({
      title: title.trim(),
      description: description?.trim() || "",
      subject: subject.trim(),
      teacherId,
      teacherName: teacherName.trim(),
      deadline: deadlineDate,
      class: normalizedClass.trim(),
      college,
      fileUrl: `/uploads/assignments/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    console.log('Assignment object created, saving...');
    await assignment.save();
    console.log('Assignment saved successfully');

    res.status(201).json({
      message: "Assignment created successfully",
      assignment
    });

  } catch (error) {
    console.error("Error creating assignment:", error);
    
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to create assignment", 
      error: error.message 
    });
  }
});

// ======================
// GET ASSIGNMENTS FOR TEACHER WITH STATS
// ======================
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const assignments = await Assignment.find({ 
      teacherId,
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .lean();

    // Add submission statistics to each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        let totalStudents = 0;
        let submittedCount = 0;
        
        try {
          // Count submitted students (unique students who submitted)
          if (assignment.submissions && assignment.submissions.length > 0) {
            const uniqueStudents = new Set(
              assignment.submissions.map(sub => sub.studentId)
            );
            submittedCount = uniqueStudents.size;
          }
          
          // Get total students for this class and college
          console.log(`Fetching students for class: ${assignment.class}, college: ${assignment.college}`);
          
          if (assignment.college === "Degree College") {
            const DCStudent = (await import("../models/DCStudent.js")).default;
            
            // Map assignment class to degree and year
            const classMapping = mapClassToDegreeYear(assignment.class);
            console.log(`Class mapping for ${assignment.class}:`, classMapping);
            
            if (classMapping) {
              // Query by degree and year
              totalStudents = await DCStudent.countDocuments({
                degree: classMapping.degree,
                year: classMapping.year
              });
              console.log(`DCStudent count for degree=${classMapping.degree}, year=${classMapping.year}: ${totalStudents}`);
            } else {
              // If no mapping found, try to find students by combining degree and year
              console.log(`No direct mapping found for ${assignment.class}, trying dynamic approach`);
              
              // Get all students and count those that would match this class
              const allStudents = await DCStudent.find({});
              totalStudents = allStudents.filter(student => {
                const generatedClass = generateClassName(student.degree, student.year);
                return generatedClass === assignment.class;
              }).length;
              console.log(`DCStudent dynamic count for ${assignment.class}: ${totalStudents}`);
              
              // Debug: Show available degree/year combinations
              const availableCombinations = allStudents.map(s => ({
                degree: s.degree,
                year: s.year,
                generatedClass: generateClassName(s.degree, s.year)
              }));
              console.log('Available DCStudent degree/year combinations:', availableCombinations);
            }
            
          } else if (assignment.college === "Junior College") {
            const JCStudent = (await import("../models/JCStudent.js")).default;
            
            // Map assignment class to stream and year
            const classMapping = mapClassToDegreeYear(assignment.class);
            console.log(`JC class mapping for ${assignment.class}:`, classMapping);
            
            if (classMapping) {
              // Query by stream and year
              totalStudents = await JCStudent.countDocuments({
                stream: classMapping.stream,
                year: classMapping.year
              });
              console.log(`JCStudent count for stream=${classMapping.stream}, year=${classMapping.year}: ${totalStudents}`);
            } else {
              // If no mapping found, try dynamic approach
              console.log(`No direct mapping found for ${assignment.class}, trying dynamic approach`);
              
              // Get all students and count those that would match this class
              const allStudents = await JCStudent.find({});
              totalStudents = allStudents.filter(student => {
                const generatedClass = generateJCClassName(student.stream, student.year);
                return generatedClass === assignment.class;
              }).length;
              console.log(`JCStudent dynamic count for ${assignment.class}: ${totalStudents}`);
              
              // Debug: Show available stream/year combinations
              const availableCombinations = allStudents.map(s => ({
                stream: s.stream,
                year: s.year,
                generatedClass: generateJCClassName(s.stream, s.year)
              }));
              console.log('Available JCStudent stream/year combinations:', availableCombinations);
            }
          }
          
        } catch (error) {
          console.error("Error calculating stats for assignment:", assignment._id, error);
          // Fallback to basic counts if database fails
          totalStudents = 0;
          submittedCount = assignment.submissions?.length || 0;
        }

        const pendingCount = Math.max(0, totalStudents - submittedCount);
        const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

        console.log(`Assignment ${assignment._id} final stats:`, {
          class: assignment.class,
          college: assignment.college,
          totalStudents,
          submittedCount,
          pendingCount,
          submissionRate
        });

        return {
          ...assignment,
          stats: {
            totalStudents,
            submittedCount,
            pendingCount,
            submissionRate
          }
        };
      })
    );

    res.json({ assignments: assignmentsWithStats });
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

// ======================
// GET ASSIGNMENTS FOR STUDENT
// ======================
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`Fetching assignments for student: ${studentId}`);
    
    // Get student information to determine their class and college
    let studentInfo = null;
    let studentClass = null;
    let studentCollege = null;
    
    // Try to find student in DCStudent collection first
    try {
      const DCStudent = (await import("../models/DCStudent.js")).default;
      studentInfo = await DCStudent.findById(studentId);
      if (studentInfo) {
        studentCollege = "Degree College";
        // Generate class name from degree and year
        studentClass = generateClassName(studentInfo.degree, studentInfo.year);
        console.log(`Found DCStudent: degree=${studentInfo.degree}, year=${studentInfo.year}, generatedClass=${studentClass}`);
      }
    } catch (error) {
      console.log("Student not found in DCStudent collection");
    }
    
    // If not found in DCStudent, try JCStudent
    if (!studentInfo) {
      try {
        const JCStudent = (await import("../models/JCStudent.js")).default;
        studentInfo = await JCStudent.findById(studentId);
        if (studentInfo) {
          studentCollege = "Junior College";
          // Generate class name from stream and year
          studentClass = generateJCClassName(studentInfo.stream, studentInfo.year);
          console.log(`Found JCStudent: stream=${studentInfo.stream}, year=${studentInfo.year}, generatedClass=${studentClass}`);
        }
      } catch (error) {
        console.log("Student not found in JCStudent collection");
      }
    }
    
    if (!studentInfo) {
      console.log(`Student ${studentId} not found in any collection`);
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log(`Student ${studentId} belongs to class: ${studentClass}, college: ${studentCollege}`);
    
    // Get assignments that match this student's class and college
    const assignments = await Assignment.find({ 
      isActive: true,
      class: studentClass,
      college: studentCollege
    })
    .sort({ deadline: 1 })
    .lean();
    
    console.log(`Found ${assignments.length} assignments for student ${studentId}`);
    
    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map(assignment => {
      const hasSubmitted = assignment.submissions?.some(sub => 
        sub.studentId.toString() === studentId
      );
      
      return {
        ...assignment,
        submissionStatus: hasSubmitted ? 'submitted' : 'pending'
      };
    });

    res.json({ 
      assignments: assignmentsWithStatus,
      studentInfo: {
        class: studentClass,
        college: studentCollege,
        name: studentInfo.fullName
      }
    });
    
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

// ======================
// GET ASSIGNMENT BY ID
// ======================
router.get("/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate("teacherId", "fullName email")
      .lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ message: "Failed to fetch assignment" });
  }
});

// ======================
// UPDATE ASSIGNMENT
// ======================
router.put("/:assignmentId", upload.single("assignmentFile"), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const {
      title,
      description,
      subject,
      deadline,
      class: className,
      college
    } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Update fields
    if (title) assignment.title = title.trim();
    if (description !== undefined) assignment.description = description.trim();
    if (subject) assignment.subject = subject.trim();
    if (deadline) assignment.deadline = new Date(deadline);
    if (className) assignment.class = className.trim();
    if (college) assignment.college = college;

    // Update file if new one uploaded
    if (req.file) {
      // Delete old file
      const oldFilePath = path.join(process.cwd(), assignment.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      assignment.fileUrl = `/uploads/assignments/${req.file.filename}`;
      assignment.fileName = req.file.originalname;
      assignment.fileSize = req.file.size;
      assignment.fileType = req.file.mimetype;
    }

    await assignment.save();

    res.json({
      message: "Assignment updated successfully",
      assignment
    });

  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Failed to update assignment" });
  }
});

// ======================
// DELETE ASSIGNMENT
// ======================
router.delete("/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Delete assignment file
    const filePath = path.join(process.cwd(), assignment.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Soft delete (set inactive)
    assignment.isActive = false;
    await assignment.save();

    res.json({ message: "Assignment deleted successfully" });

  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

// ======================
// STUDENT SUBMIT ASSIGNMENT
// ======================
router.post("/submit/:assignmentId", submissionUpload.single("submissionFile"), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { studentId, studentName, studentEmail } = req.body;

    // Validation
    if (!studentId || !studentName || !studentEmail) {
      return res.status(400).json({ message: "Student information is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Submission file is required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if student has already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }

    // Add submission to assignment
    assignment.submissions.push({
      studentId,
      studentName,
      studentEmail,
      submittedAt: new Date(),
      fileUrl: `/uploads/submissions/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      status: "submitted"
    });

    await assignment.save();

    res.status(201).json({
      message: "Assignment submitted successfully",
      submission: assignment.submissions[assignment.submissions.length - 1]
    });

  } catch (error) {
    console.error("Error submitting assignment:", error);
    
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to submit assignment", 
      error: error.message 
    });
  }
});

// ======================
// GET ASSIGNMENT SUBMISSIONS
// ======================
router.get("/submissions/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate("teacherId", "fullName email")
      .lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Get total students for statistics
    let totalStudents = 0;
    
    try {
      if (assignment.college === "Degree College") {
        const DCStudent = (await import("../models/DCStudent.js")).default;
        totalStudents = await DCStudent.countDocuments({
          class: assignment.class
        });
      } else if (assignment.college === "Junior College") {
        const JCStudent = (await import("../models/JCStudent.js")).default;
        totalStudents = await JCStudent.countDocuments({
          class: assignment.class
        });
      }
    } catch (error) {
      console.error("Error counting students for submissions:", assignmentId, error);
      totalStudents = 0;
    }

    const submittedCount = assignment.submissions?.length || 0;
    const pendingCount = Math.max(0, totalStudents - submittedCount);
    const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

    res.json({
      assignment,
      submissions: assignment.submissions || [],
      stats: {
        totalStudents,
        submittedCount,
        pendingCount,
        submissionRate
      }
    });

  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

// ======================
// SERVE ASSIGNMENT FILE
// ======================
router.get("/file/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads", "assignments", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ message: "Failed to serve file" });
  }
});

// ======================
// SERVE SUBMISSION FILE
// ======================
router.get("/submission/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads", "submissions", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving submission file:", error);
    res.status(500).json({ message: "Failed to serve file" });
  }
});

export default router;
