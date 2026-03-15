import mongoose from "mongoose";

const lectureQuerySchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    lectureTitle: {
      type: String,
      required: true,
      trim: true,
    },
    lectureSubject: {
      type: String,
      required: true,
      trim: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    studentRollNo: {
      type: String,
      default: "",
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      default: "",
      trim: true,
    },
    answeredBy: {
      type: String,
      default: "",
      trim: true,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "answered", "resolved"],
      default: "open",
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

lectureQuerySchema.index({ lectureId: 1, studentId: 1, createdAt: -1 });

export default mongoose.model("LectureQuery", lectureQuerySchema);
