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

    courseOrStream: {
      type: String,
      required: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

/*
  🔥 Compound Unique Index
  Prevents duplicate subject in same
  collegeType + year + course
*/

subjectSchema.index(
  { collegeType: 1, year: 1, semester: 1, courseOrStream: 1, subjectName: 1 },
  { unique: true }
);

export default mongoose.model("Subject", subjectSchema);
