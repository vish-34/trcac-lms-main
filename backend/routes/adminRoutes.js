import express from "express";
import User from "../models/User.js";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";
import DCTeacher from "../models/DCTeacher.js";
import JCTeacher from "../models/JCTeacher.js";

const router = express.Router();

/* ===================================================
   GET ALL TEACHERS
=================================================== */
router.get("/teachers", async (req, res) => {
  try {
    const dcTeachers = await DCTeacher.find().select("-password");
    const jcTeachers = await JCTeacher.find().select("-password");
    
    const teachers = [
      ...dcTeachers.map(t => ({ ...t.toObject(), college: "Degree College" })),
      ...jcTeachers.map(t => ({ ...t.toObject(), college: "Junior College" }))
    ];

    res.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
});

/* ===================================================
   GET ALL STUDENTS
=================================================== */
router.get("/students", async (req, res) => {
  try {
    const dcStudents = await DCStudent.find().select("-password");
    const jcStudents = await JCStudent.find().select("-password");
    
    const students = [
      ...dcStudents.map(s => ({ ...s.toObject(), college: "Degree College" })),
      ...jcStudents.map(s => ({ ...s.toObject(), college: "Junior College" }))
    ];

    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

/* ===================================================
   DELETE TEACHER
=================================================== */
router.delete("/teachers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try deleting from both collections
    const dcResult = await DCTeacher.findByIdAndDelete(id);
    const jcResult = await JCTeacher.findByIdAndDelete(id);
    
    if (!dcResult && !jcResult) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ message: "Failed to delete teacher" });
  }
});

/* ===================================================
   DELETE STUDENT
=================================================== */
router.delete("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try deleting from both collections
    const dcResult = await DCStudent.findByIdAndDelete(id);
    const jcResult = await JCStudent.findByIdAndDelete(id);
    
    if (!dcResult && !jcResult) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

export default router;
