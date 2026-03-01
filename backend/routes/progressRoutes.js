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
    const { studentId, lectureId, currentTime, duration, completed } = req.body;

    if (!studentId || !lectureId) {
      return res.status(400).json({ message: "studentId and lectureId are required" });
    }

    const safeCurrentTime = Number(currentTime || 0);
    const safeDuration = Number(duration || 0);

    // Only mark as completed if explicitly set by frontend (after anti-cheating validation)
    const isCompleted = Boolean(completed && safeCurrentTime >= safeDuration * 0.95);

    const progress = await WatchProgress.findOneAndUpdate(
      { studentId, lectureId },
      {
        $set: {
          currentTime: safeCurrentTime,
          duration: safeDuration,
          completed: isCompleted,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ 
      message: isCompleted ? "Progress completed!" : "Progress saved", 
      progress,
      completed: isCompleted
    });
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

    console.log(`🔄 Fetching continue learning data for student: ${studentId}`);

    const progress = await WatchProgress.findOne({
      studentId,
      currentTime: { $gt: 0 }, // Only show lectures with actual progress
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!progress) {
      console.log(`📝 No progress found for student: ${studentId}`);
      return res.json({ progress: null, lecture: null });
    }

    console.log(`📊 Found progress record:`, {
      progressId: progress._id,
      lectureId: progress.lectureId,
      currentTime: progress.currentTime,
      duration: progress.duration,
      completed: progress.completed,
      updatedAt: progress.updatedAt
    });

    const lecture = await Lecture.findById(progress.lectureId)
      .select('_id title subject facultyName youtubeLink college year course degree semester createdAt')
      .lean();

    if (!lecture) {
      console.log(`⚠️  Lecture not found for progress.lectureId: ${progress.lectureId}`);
      return res.json({ progress: null, lecture: null });
    }

    console.log(`📚 Found lecture for continue learning:`, {
      lectureId: lecture._id,
      title: lecture.title,
      subject: lecture.subject,
      facultyName: lecture.facultyName
    });

    res.json({ 
      progress, 
      lecture,
      metadata: {
        lectureId: lecture._id,
        progressId: progress._id,
        percentageWatched: Math.round((progress.currentTime / progress.duration) * 100)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching continue learning data:", error);
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
