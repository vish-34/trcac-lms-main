export const submitQuiz = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // ✅ Calculate Score
    let score = 0;
    exam.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    // ✅ Save Attempt
    await QuizAttempt.create({
      studentId,
      examId,
      answers,
      score
    });

    res.json({
      message: "Quiz submitted successfully",
      score,
      total: exam.questions.length
    });

  } catch (err) {
    res.status(500).json({ message: "Submission failed" });
  }
};