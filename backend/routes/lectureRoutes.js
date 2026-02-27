import express from "express";
import Lecture from "../models/Lecture.js";

const router = express.Router();

// ======================
// ADD LECTURE (ADMIN)
// ======================
router.post("/add", async (req, res) => {
  try {
    const {
      title,
      subject,
      facultyName,
      youtubeLink,
      college,
      course: bodyCourse,
      year,

      // Junior College
      stream,

      // Degree College
      degree,
      semester,
    } = req.body;

    const course = bodyCourse || (college === "Junior College" ? stream : degree);

    console.log('Received lecture data:', {
      title,
      subject,
      facultyName,
      youtubeLink,
      college,
      year,
      stream,
      degree,
      semester
    });

    // ======================
    // BASIC VALIDATION
    // ======================
    if (
      !title ||
      !subject ||
      !facultyName ||
      !youtubeLink ||
      !college ||
      !year
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // ======================
    // COLLEGE-SPECIFIC VALIDATION
    // ======================
    if (college === "Junior College") {
      if (!stream) {
        return res.status(400).json({
          message: "Stream is required for Junior College",
        });
      }
    }

    if (college === "Degree College") {
      if (!degree || !semester) {
        return res.status(400).json({
          message: "Degree and Semester are required for Degree College",
        });
      }
    }

    // ======================
    // BUILD CLEAN LECTURE OBJECT
    // ======================
    const lectureData = {
      title,
      subject,
      facultyName,
      youtubeLink,
      college,
      course,
      year,

      // Explicit defaults
      stream: null,
      degree: null,
      semester: null,
    };

    if (college === "Junior College") {
      lectureData.stream = stream;
    }

    if (college === "Degree College") {
      lectureData.degree = degree;
      lectureData.semester = semester;
    }

    console.log('Clean lecture data:', lectureData);

    // ======================
    // SAVE
    // ======================
    const lecture = await Lecture.create(lectureData);

    res.status(201).json({
      message: "Lecture added successfully",
      lecture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================
// GET LECTURES (ADMIN)
// ======================
router.get("/admin/all", async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({
      createdAt: -1,
    });

    res.json(lectures);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching lectures",
    });
  }
});

// ======================
// DELETE LECTURE (ADMIN)
// ======================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await Lecture.findByIdAndDelete(id);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found",
      });
    }

    res.status(200).json({
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error deleting lecture",
    });
  }
});

// ======================
// GET LECTURES (STUDENT)
// ======================

router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // For now, use mock student profile. In production, fetch from database
    const mockStudentProfile = {
      college: 'Degree College',
      course: 'B.Sc (CS)',
      year: 'FY',
      semester: 1
    };

    // Build filter based on student profile
    let filter = {
      college: mockStudentProfile.college,
      year: mockStudentProfile.year
    };

    // Add course-specific filters
    if (mockStudentProfile.college === 'Junior College') {
      filter.stream = mockStudentProfile.course; // For JC, course is stream
    } else {
      filter.degree = mockStudentProfile.course; // For DC, course is degree
      filter.semester = mockStudentProfile.semester; // Add semester filter for DC
    }

    const lectures = await Lecture.find(filter).sort({
      createdAt: -1,
    });

    res.json(lectures);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching lectures",
    });
  }
});

// Legacy route for backward compatibility
router.get("/student/:className", async (req, res) => {
  try {
    const lectures = await Lecture.find({
      className: req.params.className,
    }).sort({
      createdAt: -1,
    });

    res.json(lectures);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching lectures",
    });
  }
});

export default router;
