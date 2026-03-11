import Subject from "../models/Subject.js";

// =======================
// ADD SUBJECT
// =======================

export const addSubject = async (req, res) => {
  try {
    const {
      collegeType,
      year,
      semester,
      courseOrStream,
      subjectName,
      vertical   // ✅ NEW
    } = req.body;

    // VALIDATION

    if (!collegeType || !year || !courseOrStream || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // Degree needs semester + vertical

    if (collegeType === "degree" && (!semester || !vertical)) {
      return res.status(400).json({
        success: false,
        message: "Semester and Vertical required for Degree College",
      });
    }

    // Prevent Duplicate Subject

    const existingSubject = await Subject.findOne({
      collegeType,
      year,
      semester: collegeType === "degree" ? semester : null,
      courseOrStream,
      subjectName,
      vertical: collegeType === "degree" ? vertical : null,  // ✅ NEW
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists in this Vertical",
      });
    }

    // CREATE SUBJECT

    const newSubject = await Subject.create({
      collegeType,
      year,
      semester: collegeType === "degree" ? semester : null,
      courseOrStream,
      subjectName,
      vertical: collegeType === "degree" ? vertical : null,  // ✅ NEW
    });

    res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject: newSubject,
    });
  } catch (error) {
    console.log("Add Subject Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// GET SUBJECTS
// =======================

export const getSubjects = async (req, res) => {
  try {
    const { collegeType, year, semester, courseOrStream, vertical } = req.query;

    if (!collegeType || !year || !courseOrStream) {
      return res.status(400).json({
        success: false,
        message: "Missing required filters",
      });
    }

    let query = {
      collegeType,
      year,
      courseOrStream,
    };

    if (collegeType === "degree") {
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: "Semester required for Degree",
        });
      }

      query.semester = semester;

      // Optional vertical filter
      if (vertical) {
        query.vertical = Number(vertical);
      }
    }

    const subjects = await Subject.find(query).sort({ vertical: 1 });

    res.json({
      success: true,
      subjects,
    });

  } catch (error) {
    console.log("Get Subjects Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};