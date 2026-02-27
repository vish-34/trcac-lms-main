import express from 'express';
import Subject from '../models/Subject.js';

const router = express.Router();

// Get subjects based on student's course and semester
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // For now, we'll use a mock student profile
    // In production, you'd fetch student details from the database
    const mockStudentProfile = {
      college: 'Degree College',
      course: 'B.Sc (CS)',
      semester: 1
    };

    const subjects = await Subject.find({
      college: mockStudentProfile.college,
      course: mockStudentProfile.course,
      semester: mockStudentProfile.semester,
      isActive: true
    }).sort({ subjectName: 1 });

    res.json({
      success: true,
      subjects,
      studentInfo: mockStudentProfile
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects'
    });
  }
});

// Get subjects by college, course, and semester (for direct API calls)
router.get('/:college/:course/:semester', async (req, res) => {
  try {
    const { college, course, semester } = req.params;
    
    const subjects = await Subject.find({
      college,
      course,
      semester: parseInt(semester),
      isActive: true
    }).sort({ subjectName: 1 });

    res.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects'
    });
  }
});

// Get all subjects (for admin)
router.get('/', async (req, res) => {
  try {
    const { college, course, semester } = req.query;
    
    let filter = { isActive: true };
    
    if (college) filter.college = college;
    if (course) filter.course = course;
    if (semester) filter.semester = parseInt(semester);

    const subjects = await Subject.find(filter).sort({ 
      college: 1, 
      course: 1, 
      semester: 1, 
      subjectName: 1 
    });

    res.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects'
    });
  }
});

// Add new subject (for admin)
router.post('/', async (req, res) => {
  try {
    const subjectData = req.body;
    
    const newSubject = new Subject(subjectData);
    await newSubject.save();

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: newSubject
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subject'
    });
  }
});

export default router;
