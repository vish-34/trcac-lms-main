import mongoose from 'mongoose';

const DCTeacherSchema = new mongoose.Schema({
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
  course: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'teacher'
  },
  college: {
    type: String,
    default: 'Degree College'
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

export default mongoose.model('DCTeacher', DCTeacherSchema);
