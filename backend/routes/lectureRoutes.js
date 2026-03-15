import express from "express";
import Lecture from "../models/Lecture.js";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";

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

    const course =
      bodyCourse || (college === "Junior College" ? stream : degree);

    console.log("Creating new lecture with data:", {
      title,
      subject,
      facultyName,
      youtubeLink,
      college,
      course,
      year,
      stream,
      degree,
      semester,
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
      !year ||
      !course
    ) {
      return res.status(400).json({
        message: "All required fields must be provided",
        missing: {
          title: !title,
          subject: !subject,
          facultyName: !facultyName,
          youtubeLink: !youtubeLink,
          college: !college,
          year: !year,
          course: !course,
        },
      });
    }

    // ======================
    // YOUTUBE LINK VALIDATION
    // ======================
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeLink)) {
      return res.status(400).json({
        message: "Invalid YouTube link format",
      });
    }

    // ======================
    // CHECK FOR DUPLICATE LECTURES
    // ======================
    const existingLecture = await Lecture.findOne({
      title,
      subject,
      facultyName,
      college,
      year,
      course,
      ...(semester && { semester }),
    });

    if (existingLecture) {
      return res.status(409).json({
        message: "A lecture with this title already exists for this subject and faculty",
        existingLectureId: existingLecture._id,
      });
    }

    // ======================
    // CREATE LECTURE DOCUMENT
    // ======================
    const lectureData = {
      title,
      subject,
      facultyName,
      youtubeLink,
      college,
      year,
      course,
    };

    // Add college-specific fields
    if (college === "Junior College") {
      lectureData.stream = stream;
    } else if (college === "Degree College") {
      lectureData.degree = degree;
      lectureData.semester = Number(semester);
    }

    const newLecture = new Lecture(lectureData);
    const savedLecture = await newLecture.save();

    console.log("✅ Lecture created successfully:", {
      lectureId: savedLecture._id,
      title: savedLecture.title,
      subject: savedLecture.subject,
      facultyName: savedLecture.facultyName,
      college: savedLecture.college,
      createdAt: savedLecture.createdAt,
    });

    res.status(201).json({
      message: "Lecture created successfully",
      lecture: {
        _id: savedLecture._id,
        title: savedLecture.title,
        subject: savedLecture.subject,
        facultyName: savedLecture.facultyName,
        youtubeLink: savedLecture.youtubeLink,
        college: savedLecture.college,
        year: savedLecture.year,
        course: savedLecture.course,
        ...(savedLecture.stream && { stream: savedLecture.stream }),
        ...(savedLecture.degree && { degree: savedLecture.degree }),
        ...(savedLecture.semester && { semester: savedLecture.semester }),
        createdAt: savedLecture.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error creating lecture:", error);
    res.status(500).json({
      message: "Error creating lecture",
      error: error.message,
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
    const { semester, subject } = req.query;

    console.log(`📚 Fetching lectures for student: ${studentId}, semester: ${semester}, subject: ${subject}`);

    let student = await DCStudent.findById(studentId);

    if (!student) {
      console.log(`❌ Student not found: ${studentId}`);
      return res.status(404).json({ message: "Student not found" });
    }

    if (!semester) {
      console.log(`❌ Semester not provided for student: ${studentId}`);
      return res.status(400).json({ message: "Semester required" });
    }

    const filter = {
      college: student.college,
      degree: student.degree,
      year: student.year,
      semester: Number(semester)
    };

    // Add subject filter if provided
    if (subject && subject.trim() !== "") {
      filter.subject = subject.trim();
      console.log(`🎯 Adding subject filter: ${subject}`);
    }

    console.log(`🔍 Final filter:`, filter);

    const lectures = await Lecture.find(filter)
      .select('_id title subject facultyName youtubeLink college year course degree semester createdAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${lectures.length} lectures for student ${studentId}`);
    
    // Log each lecture with its unique ID
    lectures.forEach((lecture, index) => {
      console.log(`  Lecture ${index + 1}: ID=${lecture._id}, Subject=${lecture.subject}, Title=${lecture.title}`);
    });
    
    res.json(lectures);

  } catch (error) {
    console.error("❌ Error fetching student lectures:", error);
    res.status(500).json({ message: "Error fetching lectures" });
  }

});

// ======================
// GET LECTURES (TEACHER)
// ======================

router.get("/teacher/:teacherId", async (req, res) => {

  try {

    const { teacherId } = req.params;
    console.log('Fetching lectures for teacher ID:', teacherId);

    // Find lectures created by this teacher
    const lectures = await Lecture.find({ facultyName: teacherId }).sort({ createdAt: -1 });
    console.log('Found lectures:', lectures.length);
    console.log('Lectures data:', lectures);

    res.json(lectures);

  } catch (error) {
    console.log("Error in teacher lectures route:", error);
    res.status(500).json({ message: "Error fetching teacher lectures" });
  }

});

router.get("/:id", async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    res.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture by id:", error);
    res.status(500).json({ message: "Error fetching lecture" });
  }
});

export default router;
