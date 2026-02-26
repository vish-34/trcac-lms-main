import mongoose from 'mongoose';

const DCStudentSchema = new mongoose.Schema({
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
  degree: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'student'
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

export default mongoose.model('DCStudent', DCStudentSchema);
