import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true,
    trim: true
  },
  examDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    enum: ['Degree College', 'Junior College']
  },
  instructions: {
    type: String,
    trim: true
  },
  examType: {
    type: String,
    required: true,
    enum: ['midterm', 'final', 'quiz', 'practical', 'assignment']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  fileUrl: {
    type: String // For exam paper if uploaded
  },
  fileName: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examSchema.index({ teacherId: 1, examDate: -1 });
examSchema.index({ class: 1, college: 1, examDate: -1 });
examSchema.index({ examDate: -1 });
examSchema.index({ isActive: 1, examDate: -1 });

export default mongoose.model('Exam', examSchema);
