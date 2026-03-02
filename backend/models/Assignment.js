import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Assignment title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Teacher ID is required"]
  },
  teacherName: {
    type: String,
    required: [true, "Teacher name is required"],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"]
  },
  class: {
    type: String,
    required: [true, "Class is required"],
    trim: true,
    set: function(value) {
      // Auto-normalize class name to handle case sensitivity
      const classMappings = {
        'sybsccs': 'SYBScCS',
        'fybsccs': 'FYBScCS',
        'tybsccs': 'TYBScCS',
        'fybms': 'FYBMS',
        'sybms': 'SYBMS',
        'tybms': 'TYBMS',
        'fybcom': 'FYBCom',
        'sybcom': 'SYBCom',
        'tybcom': 'TYBCom',
        'fybaf': 'FYBAF',
        'sybaf': 'SYBAF',
        'tybaf': 'TYBAF',
        'fyjc': 'FYJC',
        'syjc': 'SYJC'
      };
      
      const validClasses = [
        "FYJC", "SYJC",
        "FYBScCS", "SYBScCS", "TYBScCS",
        "FYBMS", "SYBMS", "TYBMS",
        "FYBCom", "SYBCom", "TYBCom",
        "FYBAF", "SYBAF", "TYBAF",
        "FY", "SY", "TY"
      ];
      
      if (validClasses.includes(value)) {
        return value;
      }
      
      const lowerCase = value.toLowerCase();
      return classMappings[lowerCase] || value;
    }
  },
  college: {
    type: String,
    required: [true, "College type is required"],
    enum: ["Junior College", "Degree College"]
  },
  fileUrl: {
    type: String,
    required: [true, "File URL is required"]
  },
  fileName: {
    type: String,
    required: [true, "File name is required"]
  },
  fileSize: {
    type: Number,
    required: [true, "File size is required"]
  },
  fileType: {
    type: String,
    required: [true, "File type is required"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["active", "graded", "returned"],
    default: "active"
  },
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DCStudent" || "JCStudent"
    },
    studentName: {
      type: String,
      required: true
    },
    studentEmail: {
      type: String,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    fileType: String,
    status: {
      type: String,
      enum: ["submitted", "graded", "returned"],
      default: "submitted"
    },
    grade: String,
    feedback: String,
    reviewedAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
assignmentSchema.index({ teacherId: 1, class: 1 });
assignmentSchema.index({ class: 1, college: 1, deadline: 1 });
assignmentSchema.index({ "submissions.studentId": 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
