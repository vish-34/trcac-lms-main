import express from "express";
import QuizAttempt from "../models/QuizAttempt.js";

const router = express.Router();

// GET RESULTS FOR AN EXAM
router.get("/:examId", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ examId: req.params.examId })
      .populate("studentId", "fullName email rollNo class")
      .sort({ score: -1, submittedAt: 1 });

    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

export default router;
