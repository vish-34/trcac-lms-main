import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    collegeType: {
      type: String,
      required: true,
      enum: ["degree", "junior"],
    },

    year: {
      type: String,
      required: true,
    },

    semester: {
      type: String,
      required: true,
    },

    courseOrStream: {
      type: String,
      required: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      required: true,
      trim: true,
    },

    vertical: {
      type: Number,
      min: 1,
      max: 6,
      default: null,
    },

    courseCredits: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index(
  {
    collegeType: 1,
    year: 1,
    semester: 1,
    courseOrStream: 1,
    subjectName: 1,
    subjectCode: 1,
    vertical: 1,
    courseCredits: 1,
  },
  { unique: true }
);

export default mongoose.model("Subject", subjectSchema);
