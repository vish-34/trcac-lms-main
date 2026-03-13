import express from "express";
import Exam from "../models/Exam.js";
import QuizAttempt from "../models/QuizAttempt.js";

const router = express.Router();

// GET attempted quizzes for a student
router.get("/attempted/:studentId", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      studentId: req.params.studentId,
    }).select("examId");

    const attemptedExamIds = attempts.map((a) => a.examId.toString());

    res.json(attemptedExamIds);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempts" });
  }
});

// ================= GET QUIZ =================
router.get("/:examId/:studentId", async (req, res) => {
  const { examId, studentId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam || exam.examType !== "quiz")
    return res.status(404).json({ message: "Quiz not found" });

  let attempt = await QuizAttempt.findOne({ examId, studentId });

  if (!attempt) {
    const shuffled = [...exam.questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    attempt = await QuizAttempt.create({
      studentId,
      examId,
      assignedQuestions: selected.map((q) => ({
        questionId: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
      totalQuestions: selected.length,
      status: "submitted",
    });
  }

  res.json({
    title: exam.title,
    questions: attempt.assignedQuestions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      options: q.options,
    })),
  });
});

// ================= SUBMIT QUIZ =================
router.post("/submit", async (req, res) => {
  try {
    const { examId, answers, studentId } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // ⭐ CHANGE 1: Find existing locked attempt instead of blocking it
    const existing = await QuizAttempt.findOne({ examId, studentId });
    if (!existing)
      return res.status(400).json({ message: "Quiz not started properly" });

    if (existing.status === "completed")
      return res.status(400).json({ message: "Quiz already attempted" });

    // ⭐ CHANGE 2: Score only assigned questions (not full exam)
    let score = 0;
    const total = existing.assignedQuestions.length;

    existing.assignedQuestions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    const percentage = Math.round((score / total) * 100);

    const DCStudent = (await import("../models/DCStudent.js")).default;
    const JCStudent = (await import("../models/JCStudent.js")).default;

    let student = await DCStudent.findById(studentId).select("fullName email rollNo");
    let studentModel = "DCStudent";

    if (!student) {
      student = await JCStudent.findById(studentId).select("fullName email rollNo");
      studentModel = "JCStudent";
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ⭐ CHANGE 3: Update existing attempt instead of creating new one
    existing.answers = answers.map((a, i) => ({
      questionIndex: i,
      questionId: existing.assignedQuestions[i].questionId,
      selectedOption: a,
    }));

    existing.score = score;
    existing.totalQuestions = total;
    existing.percentage = percentage;
    existing.status = "completed";
    existing.studentModel = studentModel;
    existing.studentName = student.fullName;
    existing.studentEmail = student.email;
    existing.studentRollNo = student.rollNo;
    existing.submittedAt = new Date();

    await existing.save();

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
        select: "fullName email rollNo class",
      })
      .sort({ score: -1, submittedAt: 1 });

    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});



export default router;
