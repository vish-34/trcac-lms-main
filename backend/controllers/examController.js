if (req.body.examType === "quiz" && req.file) {
  const questions = await parseCSV(req.file.path);
  exam.questions = questions;
}