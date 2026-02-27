import mongoose from 'mongoose';
import Subject from './models/Subject.js';
import dotenv from 'dotenv';

dotenv.config();

const mockSubjects = [
  // B.Sc (CS) Semester 1
  {
    subjectName: 'Mathematics I',
    subjectCode: 'BSCCS101',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 1,
    credits: 4,
    type: 'core',
    description: 'Calculus and Linear Algebra fundamentals'
  },
  {
    subjectName: 'Programming Fundamentals',
    subjectCode: 'BSCCS102',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 1,
    credits: 4,
    type: 'core',
    description: 'Introduction to programming concepts and C language'
  },
  {
    subjectName: 'Digital Logic',
    subjectCode: 'BSCCS103',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Boolean algebra and digital circuit design'
  },
  {
    subjectName: 'Computer Fundamentals',
    subjectCode: 'BSCCS104',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Basic computer architecture and organization'
  },
  
  // B.Sc (CS) Semester 2
  {
    subjectName: 'Mathematics II',
    subjectCode: 'BSCCS201',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 2,
    credits: 4,
    type: 'core',
    description: 'Discrete mathematics and probability'
  },
  {
    subjectName: 'Data Structures',
    subjectCode: 'BSCCS202',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 2,
    credits: 4,
    type: 'core',
    description: 'Arrays, linked lists, stacks, queues, trees, and graphs'
  },
  {
    subjectName: 'Computer Networks',
    subjectCode: 'BSCCS203',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 2,
    credits: 3,
    type: 'core',
    description: 'OSI model and network protocols'
  },
  {
    subjectName: 'Database Systems',
    subjectCode: 'BSCCS204',
    college: 'Degree College',
    course: 'B.Sc (CS)',
    degree: 'B.Sc (CS)',
    semester: 2,
    credits: 3,
    type: 'core',
    description: 'Database design and SQL programming'
  },

  // B.Com Semester 1
  {
    subjectName: 'Financial Accounting',
    subjectCode: 'BCOM101',
    college: 'Degree College',
    course: 'BCom',
    degree: 'BCom',
    semester: 1,
    credits: 4,
    type: 'core',
    description: 'Principles and practices of financial accounting'
  },
  {
    subjectName: 'Business Mathematics',
    subjectCode: 'BCOM102',
    college: 'Degree College',
    course: 'BCom',
    degree: 'BCom',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Mathematical techniques for business applications'
  },
  {
    subjectName: 'Business Economics',
    subjectCode: 'BCOM103',
    college: 'Degree College',
    course: 'BCom',
    degree: 'BCom',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Micro and macro economics for business'
  },

  // Junior College Commerce Semester 1
  {
    subjectName: 'Accountancy',
    subjectCode: 'JCACC101',
    college: 'Junior College',
    course: 'Commerce',
    stream: 'Commerce',
    semester: 1,
    credits: 4,
    type: 'core',
    description: 'Basic accounting principles and practices'
  },
  {
    subjectName: 'Business Studies',
    subjectCode: 'JCBS101',
    college: 'Junior College',
    course: 'Commerce',
    stream: 'Commerce',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Introduction to business organization and management'
  },
  {
    subjectName: 'Economics',
    subjectCode: 'JCECO101',
    college: 'Junior College',
    course: 'Commerce',
    stream: 'Commerce',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Fundamental economic concepts'
  },

  // Junior College Arts Semester 1
  {
    subjectName: 'English Literature',
    subjectCode: 'JCENG101',
    college: 'Junior College',
    course: 'Arts',
    stream: 'Arts',
    semester: 1,
    credits: 4,
    type: 'core',
    description: 'Study of English literary works'
  },
  {
    subjectName: 'History',
    subjectCode: 'JCHIS101',
    college: 'Junior College',
    course: 'Arts',
    stream: 'Arts',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'World and Indian history'
  },
  {
    subjectName: 'Political Science',
    subjectCode: 'JCPOL101',
    college: 'Junior College',
    course: 'Arts',
    stream: 'Arts',
    semester: 1,
    credits: 3,
    type: 'core',
    description: 'Political systems and governance'
  }
];

async function seedSubjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing subjects
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');

    // Insert mock subjects
    await Subject.insertMany(mockSubjects);
    console.log(`Inserted ${mockSubjects.length} subjects`);

    console.log('Subjects seeded successfully!');
  } catch (error) {
    console.error('Error seeding subjects:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedSubjects();
