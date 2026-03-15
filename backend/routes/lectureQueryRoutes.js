import express from "express";
import Lecture from "../models/Lecture.js";
import LectureQuery from "../models/LectureQuery.js";

const router = express.Router();

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const cleanupResolvedQueries = async () => {
  const expiryDate = new Date(Date.now() - ONE_WEEK_IN_MS);
  await LectureQuery.deleteMany({
    status: "resolved",
    resolvedAt: { $lte: expiryDate },
  });
};

router.get("/student/:studentId/updates", async (req, res) => {
  try {
    await cleanupResolvedQueries();

    const { studentId } = req.params;
    const limit = Number(req.query.limit || 20);

    const queries = await LectureQuery.find({ studentId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);

    res.json(queries);
  } catch (error) {
    console.error("Error fetching student query updates:", error);
    res.status(500).json({ message: "Error fetching student query updates" });
  }
});

router.get("/teacher/:teacherName/summary", async (req, res) => {
  try {
    await cleanupResolvedQueries();

    const { teacherName } = req.params;

    const openQueries = await LectureQuery.find({
      teacherName,
      status: "open",
    }).select("lectureId");

    const lectureIdsWithOpenQueries = [...new Set(openQueries.map((item) => String(item.lectureId)))];

    res.json({
      totalOpenQueries: openQueries.length,
      lectureIdsWithOpenQueries,
    });
  } catch (error) {
    console.error("Error fetching teacher query summary:", error);
    res.status(500).json({ message: "Error fetching teacher query summary" });
  }
});

router.get("/", async (req, res) => {
  try {
    await cleanupResolvedQueries();

    const { lectureId, role, studentId, teacherName } = req.query;

    if (!lectureId) {
      return res.status(400).json({ message: "lectureId is required" });
    }

    if (!role) {
      return res.status(400).json({ message: "role is required" });
    }

    const filter = { lectureId };

    if (role === "student") {
      if (!studentId) {
        return res.status(400).json({ message: "studentId is required for students" });
      }
      filter.studentId = studentId;
    }

    if (role === "teacher" && teacherName) {
      filter.teacherName = teacherName;
    }

    const queries = await LectureQuery.find(filter).sort({ updatedAt: -1, createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error("Error fetching lecture queries:", error);
    res.status(500).json({ message: "Error fetching lecture queries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { lectureId, studentId, studentName, studentEmail, studentRollNo, question } = req.body;

    if (!lectureId || !studentId || !studentName || !question?.trim()) {
      return res.status(400).json({ message: "lectureId, studentId, studentName and question are required" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const newQuery = await LectureQuery.create({
      lectureId: lecture._id,
      lectureTitle: lecture.title,
      lectureSubject: lecture.subject,
      teacherName: lecture.facultyName,
      studentId,
      studentName,
      studentEmail: studentEmail || "",
      studentRollNo: studentRollNo || "",
      question: question.trim(),
    });

    res.status(201).json(newQuery);
  } catch (error) {
    console.error("Error creating lecture query:", error);
    res.status(500).json({ message: "Error creating lecture query" });
  }
});

router.patch("/:id/answer", async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, teacherName } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({ message: "answer is required" });
    }

    const updatedQuery = await LectureQuery.findByIdAndUpdate(
      id,
      {
        answer: answer.trim(),
        answeredBy: teacherName || "",
        answeredAt: new Date(),
        status: "answered",
        resolvedAt: null,
      },
      { new: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    res.json(updatedQuery);
  } catch (error) {
    console.error("Error answering lecture query:", error);
    res.status(500).json({ message: "Error answering lecture query" });
  }
});

router.patch("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedQuery = await LectureQuery.findByIdAndUpdate(
      id,
      {
        status: "resolved",
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    res.json(updatedQuery);
  } catch (error) {
    console.error("Error resolving lecture query:", error);
    res.status(500).json({ message: "Error resolving lecture query" });
  }
});

export default router;
