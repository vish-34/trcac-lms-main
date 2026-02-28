import express from "express";
import WatchProgress from "../models/WatchProgress.js";
import Lecture from "../models/Lecture.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Progress routes working" });
});

// ======================
// UPSERT PROGRESS
// ======================
router.post("/upsert", async (req, res) => {
  try {
    const { studentId, lectureId, currentTime, duration } = req.body;

    if (!studentId || !lectureId) {
      return res.status(400).json({ message: "studentId and lectureId are required" });
    }

    const safeCurrentTime = Number(currentTime || 0);
    const safeDuration = Number(duration || 0);

    // Disable auto-completion - videos are never marked as complete
    const completed = false;

    const progress = await WatchProgress.findOneAndUpdate(
      { studentId, lectureId },
      {
        $set: {
          currentTime: safeCurrentTime,
          duration: safeDuration,
          completed,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ message: "Progress saved", progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET CONTINUE LEARNING
// ======================
router.get("/continue/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const progress = await WatchProgress.findOne({
      studentId,
      currentTime: { $gt: 0 }, // Remove completed filter - always show latest watched
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!progress) {
      return res.json({ progress: null });
    }

    const lecture = await Lecture.findById(progress.lectureId).lean();

    res.json({ progress, lecture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET PROGRESS FOR A LECTURE
// ======================
router.get("/lecture/:studentId/:lectureId", async (req, res) => {
  try {
    const { studentId, lectureId } = req.params;

    const progress = await WatchProgress.findOne({ studentId, lectureId }).lean();

    res.json({ progress: progress || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// DEBUG: GET ALL PROGRESS FOR STUDENT
// ======================
router.get("/debug/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const allProgress = await WatchProgress.find({ studentId }).lean();

    res.json({ progress: allProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
