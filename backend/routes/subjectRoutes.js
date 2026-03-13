import express from "express";
import { addSubject } from "../controllers/subjectController.js";
import { getSubjects } from "../controllers/subjectController.js";
import Subject from "../models/Subject.js";

const router = express.Router();

router.post("/add-subject", addSubject);
router.get("/get-subjects", getSubjects);

// DEBUG: Get all subjects (temporary)
router.get("/debug-all-subjects", async (req, res) => {
  try {
    const allSubjects = await Subject.find({});
    console.log('All subjects in database:', allSubjects.length);
    
    const groupedBySemester = allSubjects.reduce((acc, subject) => {
      const sem = subject.semester || 'no-semester';
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push({
        subjectName: subject.subjectName,
        semester: subject.semester,
        vertical: subject.vertical,
        courseOrStream: subject.courseOrStream,
        year: subject.year,
        collegeType: subject.collegeType
      });
      return acc;
    }, {});
    
    console.log('Subjects by semester:', Object.keys(groupedBySemester));
    
    res.json({
      success: true,
      totalSubjects: allSubjects.length,
      subjectsBySemester: groupedBySemester,
      allSubjects: allSubjects.map(s => ({
        subjectName: s.subjectName,
        semester: s.semester,
        vertical: s.vertical,
        courseOrStream: s.courseOrStream,
        year: s.year,
        collegeType: s.collegeType
      }))
    });
  } catch (error) {
    console.log('Debug error:', error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

export default router;