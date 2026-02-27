import mongoose from "mongoose";

const watchProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    currentTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

watchProgressSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });

export default mongoose.model("WatchProgress", watchProgressSchema);
