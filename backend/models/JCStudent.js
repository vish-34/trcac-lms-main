import mongoose from 'mongoose';

const JCStudentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  stream: {
    type: String,
    required: true,
    enum: ['Commerce', 'Arts']
  },
  year: {
    type: String,
    required: true,
    enum: ['FY', 'SY']
  },
  role: {
    type: String,
    default: 'student'
  },
  college: {
    type: String,
    default: 'Junior College'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

export default mongoose.model('JCStudent', JCStudentSchema);
