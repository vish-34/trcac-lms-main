import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true
  },
  college: {
    type: String,
    required: true,
    enum: ['Degree College', 'Junior College']
  },
  course: {
    type: String,
    required: true
  },
  stream: {
    type: String,
    enum: ['Commerce', 'Arts'],
    required: function() {
      return this.college === 'Junior College';
    }
  },
  degree: {
    type: String,
    required: function() {
      return this.college === 'Degree College';
    }
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  type: {
    type: String,
    enum: ['core', 'elective', 'practical'],
    default: 'core'
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
SubjectSchema.index({ college: 1, course: 1, stream: 1, degree: 1, semester: 1 });
SubjectSchema.index({ subjectCode: 1 });

// Update the updatedAt field on save
SubjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Subject', SubjectSchema);
