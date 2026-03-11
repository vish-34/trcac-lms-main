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

    vertical: {                     // ✅ NEW FIELD
      type: Number,
      required: function () {
        return this.collegeType === "degree"; 
      },
      min: 1,
      max: 6,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

/*
  🔥 Compound Unique Index
  Prevents duplicate subject in same
  collegeType + year + course
*/

subjectSchema.index(
  {
    collegeType: 1,
    year: 1,
    semester: 1,
    courseOrStream: 1,
    vertical: 1,      // ✅ added
    subjectName: 1
  },
  { unique: true }
);

export default mongoose.model("Subject", subjectSchema);
