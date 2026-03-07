import express from "express";
import Exam from "../models/Exam.js";
import QuizAttempt from "../models/QuizAttempt.js";

const router = express.Router();

// ================= GET QUIZ =================
router.get("/:examId", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam || exam.examType !== "quiz") {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({
      title: exam.title,
      questions: exam.questions || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load quiz" });
  }
});

// ================= SUBMIT QUIZ =================
router.post("/submit", async (req, res) => {
  try {
    const { examId, answers, studentId } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const existing = await QuizAttempt.findOne({ examId, studentId });
    if (existing)
      return res.status(400).json({ message: "Quiz already attempted" });

    let score = 0;
    const total = exam.questions.length;

    exam.questions.forEach((q, i) => {
      const correctIndex = ["A", "B", "C", "D"].indexOf(q.correctAnswer);
      const correctOption = q.options[correctIndex];
      if (answers[i] === correctOption) score++;
    });

    const percentage = Math.round((score / total) * 100);

    const DCStudent = (await import("../models/DCStudent.js")).default;
    const student = await DCStudent.findById(studentId);
    const studentModel = student ? "DCStudent" : "JCStudent";

    await QuizAttempt.create({
      studentId,
      studentModel, // ⭐ ADD THIS
      examId,
      answers: answers.map((a, i) => ({
        questionIndex: i,
        selectedOption: a,
      })),
      score,
      totalQuestions: total,
      percentage,
      status: "completed",
    });

    res.json({
      message: "Quiz submitted successfully",
      score,
      total,
      percentage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Submission failed" });
  }
});

router.get("/results/:examId", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      examId: req.params.examId,
    })
      .populate({
        path: "studentId",
        select: "fullName email class",
      })
      .sort({ score: -1 });

    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

// GET attempted quizzes for a student
router.get("/attempted/:studentId", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      studentId: req.params.studentId
    }).select("examId");

    const attemptedExamIds = attempts.map(a => a.examId.toString());

    res.json(attemptedExamIds);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempts" });
  }
});

export default router;
