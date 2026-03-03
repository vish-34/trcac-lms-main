import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
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
  markedAt: {
    type: Date,
    default: Date.now,
  },
  watchPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  attendanceStatus: {
    type: String,
    enum: ["present", "absent"],
    default: "present",
  },
  // Track if attendance was automatically marked based on video progress
  autoMarked: {
    type: Boolean,
    default: true,
  },
  // Store the progress record ID for reference
  progressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WatchProgress",
  },
}, {
  timestamps: true,
});

// Compound index for unique attendance per student per lecture
attendanceSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });

// Index for attendance queries
attendanceSchema.index({ studentId: 1, markedAt: -1 });
attendanceSchema.index({ lectureId: 1, attendanceStatus: 1 });

export default mongoose.model("Attendance", attendanceSchema);
