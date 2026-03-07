import mongoose from "mongoose";

const QuizAttemptSchema = new mongoose.Schema({
 studentId: {
  type: mongoose.Schema.Types.ObjectId,
  refPath: "studentModel"
},
studentModel: {
  type: String,
  enum: ["DCStudent", "JCStudent"]
},

  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true
  },

  answers: [
    {
      questionIndex: Number,
      selectedOption: String
    }
  ],

  score: {
    type: Number,
    required: true
  },

  totalQuestions: {
    type: Number,
    required: true
  },

  percentage: {
    type: Number
  },

  status: {
    type: String,
    enum: ["completed", "timeout", "submitted"],
    default: "submitted"
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// 🚫 Prevent retakes (one attempt per student per quiz)
QuizAttemptSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export default mongoose.model("QuizAttempt", QuizAttemptSchema);