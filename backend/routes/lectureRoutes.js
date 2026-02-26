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
      className,
      subject,
      facultyName, // ✅ NEW FIELD
      youtubeLink,
    } = req.body;

    // VALIDATION

    if (!title || !className || !subject || !facultyName || !youtubeLink) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // CREATE LECTURE

    const lecture = new Lecture({
      title,
      className,
      subject,
      facultyName,
      youtubeLink,
    });

    await lecture.save();

    res.status(201).json({
      message: "Lecture Added Successfully",

      lecture,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

// ======================
// GET ALL LECTURES (ADMIN)
// ======================

router.get("/all", async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 });

    res.json(lectures);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching lectures",
    });
  }
});

// ======================
// GET LECTURES (STUDENT)
// ======================

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

// ======================
// DELETE LECTURE (ADMIN)
// ======================

router.delete("/delete/:id", async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found",
      });
    }

    res.json({
      message: "Lecture Deleted Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;
