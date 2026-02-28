import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Exam from "../models/Exam.js";

const router = express.Router();

// Configure multer for exam file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "exams");
    
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

const fileFilter = (req, file, cb) => {
  // Allow PDF files and images
  if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ======================
// CREATE EXAM (TEACHER)
// ======================
router.post("/create", upload.single("examFile"), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      teacherId,
      teacherName,
      examDate,
      duration,
      totalMarks,
      class: className,
      college,
      instructions,
      examType
    } = req.body;

    // Validation
    if (!title || !subject || !teacherId || !teacherName || !examDate || !duration || !totalMarks || !className || !college || !examType) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Parse exam date
    const examDateTime = new Date(examDate);
    if (isNaN(examDateTime.getTime())) {
      return res.status(400).json({ message: "Invalid exam date format" });
    }

    // Create exam
    const exam = new Exam({
      title: title.trim(),
      description: description?.trim() || "",
      subject: subject.trim(),
      teacherId,
      teacherName: teacherName.trim(),
      examDate: examDateTime,
      duration: parseInt(duration),
      totalMarks: parseInt(totalMarks),
      class: className.trim(),
      college,
      instructions: instructions?.trim() || "",
      examType,
      fileUrl: req.file ? `/uploads/exams/${req.file.filename}` : undefined,
      fileName: req.file ? req.file.originalname : undefined
    });

    await exam.save();

    res.status(201).json({
      message: "Exam created successfully",
      exam
    });

  } catch (error) {
    console.error("Error creating exam:", error);
    
    // Clean up uploaded file if there's an error
    if (req.file) {
      const filePath = path.join(process.cwd(), req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: "Failed to create exam" });
  }
});

// ======================
// GET EXAMS FOR TEACHER
// ======================
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { includeCompleted = false } = req.query;

    const query = { teacherId, isActive: true };
    if (!includeCompleted) {
      query.examDate = { $gte: new Date() };
    }

    const exams = await Exam.find(query)
      .sort({ examDate: 1 })
      .lean();

    res.json({ exams });

  } catch (error) {
    console.error("Error fetching teacher exams:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
});

// ======================
// GET UPCOMING EXAMS FOR TEACHER
// ======================
router.get("/upcoming/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { limit = 10 } = req.query;

    const now = new Date();
    const exams = await Exam.find({
      teacherId,
      isActive: true,
      examDate: { $gt: now }
    })
    .sort({ examDate: 1 })
    .limit(parseInt(limit))
    .lean();

    res.json({ exams });

  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    res.status(500).json({ message: "Failed to fetch upcoming exams" });
  }
});

// ======================
// GET PENDING ASSIGNMENT REVIEWS
// ======================
router.get("/pending-reviews/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Get assignments with submitted but not reviewed submissions
    const Assignment = (await import("../models/Assignment.js")).default;
    
    const assignments = await Assignment.find({
      teacherId,
      isActive: true,
      "submissions.status": "submitted"
    })
    .sort({ deadline: -1 })
    .lean();

    // Process assignments to get pending review count
    const pendingReviews = assignments.map(assignment => {
      const pendingSubmissions = assignment.submissions.filter(
        sub => sub.status === "submitted"
      );
      
      return {
        assignmentId: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        class: assignment.class,
        college: assignment.college,
        deadline: assignment.deadline,
        pendingCount: pendingSubmissions.length,
        pendingSubmissions: pendingSubmissions.map(sub => ({
          studentId: sub.studentId,
          studentName: sub.studentName,
          studentEmail: sub.studentEmail,
          submittedAt: sub.submittedAt,
          fileUrl: sub.fileUrl,
          fileName: sub.fileName
        }))
      };
    }).filter(assignment => assignment.pendingCount > 0);

    res.json({ pendingReviews });

  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    res.status(500).json({ message: "Failed to fetch pending reviews" });
  }
});

// ======================
// UPDATE EXAM
// ======================
router.put("/:examId", upload.single("examFile"), async (req, res) => {
  try {
    const { examId } = req.params;
    const {
      title,
      description,
      subject,
      examDate,
      duration,
      totalMarks,
      instructions,
      examType
    } = req.body;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Update fields
    if (title) exam.title = title.trim();
    if (description !== undefined) exam.description = description.trim();
    if (subject) exam.subject = subject.trim();
    if (examDate) exam.examDate = new Date(examDate);
    if (duration) exam.duration = parseInt(duration);
    if (totalMarks) exam.totalMarks = parseInt(totalMarks);
    if (instructions !== undefined) exam.instructions = instructions.trim();
    if (examType) exam.examType = examType;

    // Update file if new one uploaded
    if (req.file) {
      // Delete old file
      if (exam.fileUrl) {
        const oldFilePath = path.join(process.cwd(), exam.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      exam.fileUrl = `/uploads/exams/${req.file.filename}`;
      exam.fileName = req.file.originalname;
    }

    await exam.save();

    res.json({
      message: "Exam updated successfully",
      exam
    });

  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({ message: "Failed to update exam" });
  }
});

// ======================
// DELETE EXAM
// ======================
router.delete("/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Delete exam file
    if (exam.fileUrl) {
      const filePath = path.join(process.cwd(), exam.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Soft delete (set inactive)
    exam.isActive = false;
    await exam.save();

    res.json({ message: "Exam deleted successfully" });

  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ message: "Failed to delete exam" });
  }
});

export default router;
