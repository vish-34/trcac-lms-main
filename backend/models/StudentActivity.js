import mongoose from 'mongoose';

const studentActivitySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DCStudent',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['lecture_viewed', 'assignment_submitted', 'assignment_downloaded', 'login']
  },
  activityDetails: {
    // Flexible object structure for different activity types
    lectureId: String,
    lectureTitle: String,
    lectureSubject: String,
    watchDuration: Number, // in seconds
    totalDuration: Number, // in seconds
    watchPercentage: Number,
    
    // For assignment activities
    assignmentId: String,
    assignmentTitle: String,
    assignmentSubject: String,
    submissionStatus: {
      type: String,
      enum: ['submitted', 'downloaded']
    },
    
    // Allow any additional properties
    type: mongoose.Schema.Types.Mixed
  },
  college: {
    type: String,
    required: true,
    enum: ['Degree College', 'Junior College']
  },
  class: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for better query performance
studentActivitySchema.index({ studentId: 1, timestamp: -1 });
studentActivitySchema.index({ college: 1, class: 1, timestamp: -1 });
studentActivitySchema.index({ activityType: 1, timestamp: -1 });
studentActivitySchema.index({ timestamp: -1 });

export default mongoose.model('StudentActivity', studentActivitySchema);
