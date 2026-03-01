import Subject from "../models/Subject.js";

// =======================
// ADD SUBJECT
// =======================

export const addSubject = async (req, res) => {
  try {
    const { collegeType, year, semester, courseOrStream, subjectName } =
      req.body;

    // VALIDATION

    if (!collegeType || !year || !courseOrStream || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // Degree needs semester

    if (collegeType === "degree" && !semester) {
      return res.status(400).json({
        success: false,
        message: "Semester required for Degree College",
      });
    }

    // Prevent Duplicate Subject

    const existingSubject = await Subject.findOne({
      collegeType,
      year,
      semester: collegeType === "degree" ? semester : null,
      courseOrStream,
      subjectName,
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists",
      });
    }

    // CREATE SUBJECT

    const newSubject = await Subject.create({
      collegeType,
      year,
      semester: collegeType === "degree" ? semester : null,

      courseOrStream,
      subjectName,
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
    const { collegeType, year, semester, courseOrStream } = req.query;

    let query = {
      collegeType,
      year,
      courseOrStream,
    };

    // Degree also filters semester

    if (collegeType === "degree") {
      query.semester = semester;
    }

    const subjects = await Subject.find(query)

      .sort({ createdAt: -1 });

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
