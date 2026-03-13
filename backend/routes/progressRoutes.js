import express from "express";
import WatchProgress from "../models/WatchProgress.js";
import Lecture from "../models/Lecture.js";
import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";

const router = express.Router();

const generateClassName = (degree, year) => {
  const degreeMappings = {
    "B.Sc (CS)": "BScCS",
    "BMS": "BMS",
    "BCom": "BCom",
    "BAF": "BAF"
  };

  return year + (degreeMappings[degree] || "");
};

const generateJCClassName = (stream, year) => {
  return year + stream;
};

router.get("/", (req, res) => {
  res.json({ message: "Progress routes working" });
});

// ======================
// UPSERT PROGRESS
// ======================
router.post("/upsert", async (req, res) => {
  try {
    const { studentId, lectureId, currentTime, duration, completed } = req.body;

    if (!studentId || !lectureId) {
      return res.status(400).json({ message: "studentId and lectureId are required" });
    }

    const safeCurrentTime = Number(currentTime || 0);
    const safeDuration = Number(duration || 0);

    // Only mark as completed if explicitly set by frontend (after anti-cheating validation)
    const isCompleted = Boolean(completed && safeCurrentTime >= safeDuration * 0.95);
    
    // Calculate watch percentage
    const watchPercentage = safeDuration > 0 ? Math.round((safeCurrentTime / safeDuration) * 100) : 0;

    const progress = await WatchProgress.findOneAndUpdate(
      { studentId, lectureId },
      {
        $set: {
          currentTime: safeCurrentTime,
          duration: safeDuration,
          completed: isCompleted,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Auto-mark attendance if student reaches 75% watch time and hasn't been marked yet
    let attendanceMarked = false;
    if (watchPercentage >= 75) {
      try {
        // Check if attendance already exists for this lecture
        const existingAttendance = await Attendance.findOne({ studentId, lectureId });
        
        if (!existingAttendance) {
          // Create new attendance record
          const attendance = new Attendance({
            studentId,
            lectureId,
            watchPercentage,
            attendanceStatus: "present",
            autoMarked: true,
            progressId: progress._id,
            markedAt: new Date()
          });
          
          await attendance.save();
          attendanceMarked = true;
          console.log(`Attendance auto-marked for student ${studentId} in lecture ${lectureId} at ${watchPercentage}%`);
        }
      } catch (attendanceError) {
        // Log attendance error but don't fail the progress update
        console.error("Error marking attendance:", attendanceError);
      }
    }

    res.json({ 
      message: isCompleted ? "Progress completed!" : "Progress saved", 
      progress,
      completed: isCompleted,
      watchPercentage,
      attendanceMarked,
      attendanceStatus: watchPercentage >= 75 ? "present" : "pending"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET ATTENDANCE FOR STUDENT
// ======================
router.get("/attendance/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // Build query
    const query = { studentId };
    if (status && status !== 'all') {
      query.attendanceStatus = status;
    }

    // Get attendance records with lecture details
    const attendanceRecords = await Attendance.find(query)
      .populate('lectureId', 'title subject facultyName college year course degree semester createdAt')
      .sort({ markedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Get progress details for each attendance record
    const attendanceWithProgress = await Promise.all(
      attendanceRecords.map(async (record) => {
        const progress = await WatchProgress.findOne({ 
          studentId, 
          lectureId: record.lectureId._id 
        }).lean();

        return {
          ...record,
          progress: progress ? {
            currentTime: progress.currentTime,
            duration: progress.duration,
            completed: progress.completed,
            percentageWatched: Math.round((progress.currentTime / progress.duration) * 100),
            lastWatched: progress.updatedAt,
            watchTime: Math.floor(progress.currentTime / 60) + ':' + String(Math.floor(progress.currentTime % 60)).padStart(2, '0'),
            totalTime: Math.floor(progress.duration / 60) + ':' + String(Math.floor(progress.duration % 60)).padStart(2, '0')
          } : null
        };
      })
    );

    res.json({
      attendance: attendanceWithProgress,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPreviousPage: parseInt(page) > 1
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET ATTENDANCE STATISTICS FOR STUDENT
// ======================
router.get("/attendance-stats/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get attendance statistics
    const totalLectures = await Attendance.countDocuments({ studentId });
    const presentLectures = await Attendance.countDocuments({ 
      studentId, 
      attendanceStatus: "present" 
    });
    const absentLectures = await Attendance.countDocuments({ 
      studentId, 
      attendanceStatus: "absent" 
    });

    // Get attendance by subject
    const attendanceBySubject = await Attendance.aggregate([
      { $match: { studentId } },
      {
        $lookup: {
          from: 'lectures',
          localField: 'lectureId',
          foreignField: '_id',
          as: 'lecture'
        }
      },
      { $unwind: '$lecture' },
      {
        $group: {
          _id: '$lecture.subject',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          subject: '$_id',
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $multiply: [
              { $divide: ['$present', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { subject: 1 } }
    ]);

    const attendancePercentage = totalLectures > 0 ? Math.round((presentLectures / totalLectures) * 100) : 0;

    res.json({
      totalLectures,
      presentLectures,
      absentLectures,
      attendancePercentage,
      attendanceBySubject
    });
  } catch (error) {
    console.error("Error fetching attendance statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET DASHBOARD STATISTICS FOR STUDENT
// ======================
router.get("/dashboard-stats/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`=== DASHBOARD STATS REQUEST ===`);
    console.log(`Student ID from request: ${studentId}`);
    console.log(`Student ID type: ${typeof studentId}`);
    console.log(`Student ID length: ${studentId?.length}`);

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: null,
          totalLectures: { $sum: 1 },
          presentLectures: {
            $sum: { $cond: [{ $eq: ['$attendanceStatus', 'present'] }, 1, 0] }
          }
        }
      }
    ]);

    const attendanceData = attendanceStats[0] || { totalLectures: 0, presentLectures: 0 };
    const attendancePercentage = attendanceData.totalLectures > 0 
      ? Math.round((attendanceData.presentLectures / attendanceData.totalLectures) * 100) 
      : 0;

    console.log(`Attendance data:`, attendanceData);

    // Get lectures completed statistics
    const lecturesCompleted = await WatchProgress.countDocuments({ 
      studentId, 
      completed: true 
    });

    console.log(`Lectures completed: ${lecturesCompleted}`);

    // Get assignments statistics
    try {
      // Get student info to determine their class and college
      let studentClass = null;
      let studentCollege = null;
      let studentInfo = null;
      
      console.log(`Looking up student info for ID: ${studentId}`);
      
      // Try to find student in DCStudent collection first
      try {
        const DCStudent = (await import("../models/DCStudent.js")).default;
        
        // Try multiple ID fields that might be used
        studentInfo = await DCStudent.findById(studentId);
        if (!studentInfo) {
          // Try by email if ID lookup fails
          studentInfo = await DCStudent.findOne({ email: studentId });
        }
        if (!studentInfo) {
          // Try by _id field as string
          studentInfo = await DCStudent.findOne({ _id: studentId });
        }
        
        console.log('DCStudent lookup result:', studentInfo);
        if (studentInfo) {
          studentCollege = "Degree College";
          studentClass = generateClassName(studentInfo.degree, studentInfo.year);
          console.log(`Found DCStudent - College: ${studentCollege}, Year: ${studentInfo.year}, Class: ${studentClass}`);
        }
      } catch (error) {
        console.log("Error in DCStudent lookup:", error);
      }
      
      // If not found in DCStudent, try JCStudent
      if (!studentClass) {
        try {
          const JCStudent = (await import("../models/JCStudent.js")).default;
          
          // Try multiple ID fields that might be used
          studentInfo = await JCStudent.findById(studentId);
          if (!studentInfo) {
            // Try by email if ID lookup fails
            studentInfo = await JCStudent.findOne({ email: studentId });
          }
          if (!studentInfo) {
            // Try by _id field as string
            studentInfo = await JCStudent.findOne({ _id: studentId });
          }
          
          console.log('JCStudent lookup result:', studentInfo);
          if (studentInfo) {
            studentCollege = "Junior College";
            studentClass = generateJCClassName(studentInfo.stream, studentInfo.year);
            console.log(`Found JCStudent - College: ${studentCollege}, Year: ${studentInfo.year}, Class: ${studentClass}`);
          }
        } catch (error) {
          console.log("Error in JCStudent lookup:", error);
        }
      }
      
      if (!studentInfo) {
        console.log(`Student ${studentId} not found in any collection`);
        
        // Try to get some basic data even without student info
        try {
          // Get assignments with proper filtering
          const Assignment = (await import("../models/Assignment.js")).default;
          
          // Try to determine student info from attendance or progress records
          let fallbackStudentClass = null;
          let fallbackCollege = null;
          
          // Check attendance records for student info
          const attendanceRecord = await Attendance.findOne({ studentId }).lean();
          if (attendanceRecord) {
            // Get lecture info to determine class/year
            const lecture = await Lecture.findById(attendanceRecord.lectureId).lean();
            if (lecture) {
              fallbackStudentClass = lecture.class;
              fallbackCollege = lecture.college;
              console.log(`Determined from attendance: Class=${fallbackStudentClass}, College=${fallbackCollege}`);
            }
          }
          
          // If still no info, try progress records
          if (!fallbackStudentClass) {
            const progressRecord = await WatchProgress.findOne({ studentId }).lean();
            if (progressRecord) {
              const progressLecture = await Lecture.findById(progressRecord.lectureId).lean();
              if (progressLecture) {
                fallbackStudentClass = progressLecture.class;
                fallbackCollege = progressLecture.college;
                console.log(`Determined from progress: Class=${fallbackStudentClass}, College=${fallbackCollege}`);
              }
            }
          }
          
          // Fetch assignments with proper filtering
          let allAssignments;
          if (fallbackStudentClass && fallbackCollege) {
            allAssignments = await Assignment.find({ 
              isActive: true,
              class: fallbackStudentClass,
              college: fallbackCollege
            }).lean();
          } else {
            // Last resort - get degree college assignments for SY year
            allAssignments = await Assignment.find({ 
              isActive: true,
              college: "Degree College",
              class: { $regex: 'SY' }  // Match SYBScCS, SYBMS, etc.
            }).lean();
          }
          
          // Calculate pending assignments properly
          const pendingAssignments = allAssignments.filter(assignment => {
            // Check if student has submitted this assignment
            const hasSubmitted = assignment.submissions?.some(sub => 
              sub.studentId.toString() === studentId
            );
            return !hasSubmitted;
          }).length;
          
          const uniqueSubjects = [...new Set(allAssignments.map(assignment => assignment.subject).filter(Boolean))];
          
          console.log(`Fallback: Found ${allAssignments.length} total assignments, ${pendingAssignments} pending`);
          console.log(`Fallback: Using class=${fallbackStudentClass}, college=${fallbackCollege}`);
          console.log(`Fallback: Found ${uniqueSubjects.length} subjects:`, uniqueSubjects);
          
          return res.json({
            attendance: {
              percentage: attendancePercentage,
              totalLectures: attendanceData.totalLectures,
              presentLectures: attendanceData.presentLectures
            },
            lecturesCompleted,
            assignments: {
              pending: pendingAssignments, // Properly calculated pending count
              total: allAssignments.length
            },
            subjects: uniqueSubjects.length,
            subjectsInfo: {
              semesters: ['3', '4'], // Default semesters
              college: 'Degree College', // Default college
              year: 'SY' // Default year
            }
          });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          
          // Final fallback with hardcoded data
          return res.json({
            attendance: {
              percentage: attendancePercentage,
              totalLectures: attendanceData.totalLectures,
              presentLectures: attendanceData.presentLectures
            },
            lecturesCompleted,
            assignments: {
              pending: 0,
              total: 0
            },
            subjects: 0,
            subjectsInfo: {
              semesters: null,
              college: null,
              year: null
            }
          });
        }
      }
      
      // Get assignments for this student
      const assignments = await Assignment.find({ 
        isActive: true,
        class: studentClass,
        college: studentCollege
      }).lean();
      
      const pendingAssignments = assignments.filter(assignment => {
        // Check if student has submitted this assignment
        const hasSubmitted = assignment.submissions?.some(sub => 
          sub.studentId.toString() === studentId
        );
        return !hasSubmitted;
      }).length;

      // Get subjects count - fetch all subjects for the student's semesters
      let subjectsCount = 0;
      let semesters = [];
      
      try {
        console.log('Attempting to fetch subjects for student:', {
          studentCollege,
          studentYear: studentInfo?.year,
          studentDegree: studentInfo?.degree
        });
        
        // Import subjects model
        const Subject = (await import("../models/Subject.js")).default;
        
        if (studentInfo && studentCollege) {
          // For degree college students, get subjects for both current and relevant semesters
          if (studentCollege === "Degree College") {
            // Map year to semester number
            const yearToSemester = {
              'FY': '1',  // First Year -> Semester 1 & 2
              'SY': '3',  // Second Year -> Semester 3 & 4  
              'TY': '5'   // Third Year -> Semester 5 & 6
            };
            
            const currentSem = yearToSemester[studentInfo.year] || "3";
            semesters = [currentSem];
            
            // Add adjacent semester for broader view
            const semNum = parseInt(currentSem);
            if (semNum === 1) {
              semesters.push("2");
            } else if (semNum === 3) {
              semesters.push("4");
            } else if (semNum === 5) {
              semesters.push("6");
            } else if (currentSem === "2") {
              semesters.push("1");
            } else if (currentSem === "4") {
              semesters.push("3");
            } else if (currentSem === "6") {
              semesters.push("5");
            }
            
            console.log(`Querying subjects for year ${studentInfo.year}, semesters [${semesters.join(', ')}]`);
            
            const semesterSubjects = await Subject.find({
              collegeType: "degree",
              year: studentInfo.year || "",
              semester: { $in: semesters },
              isActive: true
            }).lean();
            
            console.log(`Found ${semesterSubjects.length} subject documents`);
            
            // Get unique subjects from specified semesters
            const uniqueSubjects = [...new Set(semesterSubjects.map(subject => subject.subjectName).filter(Boolean))];
            subjectsCount = uniqueSubjects.length;
            
            console.log(`Found ${subjectsCount} unique subjects for degree college student ${studentId} from year ${studentInfo.year}, semesters [${semesters.join(', ')}]:`, uniqueSubjects);
          }
          // For junior college students
          else if (studentCollege === "Junior College") {
            const jcSubjects = await Subject.find({
              collegeType: "junior",
              year: studentInfo.year || "",
              courseOrStream: studentInfo.stream || "",
              isActive: true
            }).lean();
            
            const uniqueSubjects = [...new Set(jcSubjects.map(subject => subject.subjectName).filter(Boolean))];
            subjectsCount = uniqueSubjects.length;
            
            console.log(`Found ${subjectsCount} unique subjects for junior college student ${studentId}:`, uniqueSubjects);
          }
        } else {
          // Fallback if student info not found
          console.log(`Student info not found for ${studentId}, using assignment-based subject count`);
          const uniqueSubjects = [...new Set(assignments.map(assignment => assignment.subject).filter(Boolean))];
          subjectsCount = uniqueSubjects.length;
          console.log(`Fallback: Found ${subjectsCount} subjects from assignments:`, uniqueSubjects);
        }
        
      } catch (subjectsError) {
        console.error('Error fetching subjects for dashboard stats:', subjectsError);
        // Fallback to assignment-based subject count
        const uniqueSubjects = [...new Set(assignments.map(assignment => assignment.subject).filter(Boolean))];
        subjectsCount = uniqueSubjects.length;
        console.log(`Error fallback: Found ${subjectsCount} subjects from assignments:`, uniqueSubjects);
      }

      res.json({
        attendance: {
          percentage: attendancePercentage,
          totalLectures: attendanceData.totalLectures,
          presentLectures: attendanceData.presentLectures
        },
        lecturesCompleted,
        assignments: {
          pending: pendingAssignments,
          total: assignments.length
        },
        subjects: subjectsCount,
        subjectsInfo: {
          semesters: semesters.length > 0 ? semesters : (subjectsCount > 0 ? ['3', '4'] : null),
          college: studentCollege,
          year: studentInfo?.year || null
        }
      });
    } catch (assignmentError) {
      console.error('Error fetching assignments for dashboard stats:', assignmentError);
      // Return partial data if assignments fetch fails
      res.json({
        attendance: {
          percentage: attendancePercentage,
          totalLectures: attendanceData.totalLectures,
          presentLectures: attendanceData.presentLectures
        },
        lecturesCompleted,
        assignments: {
          pending: 0,
          total: 0
        },
        subjects: 0,
        subjectsInfo: {
          semesters: null,
          college: null,
          year: null
        }
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET CONTINUE LEARNING
// ======================
router.get("/continue/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`🔄 Fetching continue learning data for student: ${studentId}`);

    const progress = await WatchProgress.findOne({
      studentId,
      currentTime: { $gt: 0 }, // Only show lectures with actual progress
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!progress) {
      console.log(`📝 No progress found for student: ${studentId}`);
      return res.json({ progress: null, lecture: null });
    }

    console.log(`📊 Found progress record:`, {
      progressId: progress._id,
      lectureId: progress.lectureId,
      currentTime: progress.currentTime,
      duration: progress.duration,
      completed: progress.completed,
      updatedAt: progress.updatedAt
    });

    const lecture = await Lecture.findById(progress.lectureId)
      .select('_id title subject facultyName youtubeLink college year course degree semester createdAt')
      .lean();

    if (!lecture) {
      console.log(`⚠️  Lecture not found for progress.lectureId: ${progress.lectureId}`);
      return res.json({ progress: null, lecture: null });
    }

    console.log(`📚 Found lecture for continue learning:`, {
      lectureId: lecture._id,
      title: lecture.title,
      subject: lecture.subject,
      facultyName: lecture.facultyName
    });

    res.json({ 
      progress, 
      lecture,
      metadata: {
        lectureId: lecture._id,
        progressId: progress._id,
        percentageWatched: Math.round((progress.currentTime / progress.duration) * 100)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching continue learning data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET PROGRESS FOR A LECTURE
// ======================
router.get("/lecture/:studentId/:lectureId", async (req, res) => {
  try {
    const { studentId, lectureId } = req.params;

    const progress = await WatchProgress.findOne({ studentId, lectureId }).lean();

    res.json({ progress: progress || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// GET ALL LECTURE HISTORY FOR STUDENT
// ======================
router.get("/history/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log(`📚 Fetching lecture history for student: ${studentId}`);

    // Get all progress records for this student (without limit first to get accurate total)
    const allProgressRecords = await WatchProgress.find({ studentId })
      .sort({ updatedAt: -1 })
      .lean();

    if (!allProgressRecords || allProgressRecords.length === 0) {
      console.log(`📝 No progress records found for student: ${studentId}`);
      return res.json({ 
        lectures: [], 
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page)
      });
    }

    // Get lecture details for each progress record
    const lectureIds = allProgressRecords.map(p => p.lectureId);
    const lectures = await Lecture.find({ _id: { $in: lectureIds } })
      .select('_id title subject facultyName youtubeLink college year course degree semester createdAt')
      .lean();

    // Combine progress with lecture details and filter out non-existent lectures
    const lectureHistory = allProgressRecords.map(progress => {
      const lecture = lectures.find(l => l._id.toString() === progress.lectureId.toString());
      if (!lecture) return null;

      return {
        ...lecture,
        progress: {
          currentTime: progress.currentTime,
          duration: progress.duration,
          completed: progress.completed,
          percentageWatched: Math.round((progress.currentTime / progress.duration) * 100),
          lastWatched: progress.updatedAt,
          watchTime: Math.floor(progress.currentTime / 60) + ':' + String(Math.floor(progress.currentTime % 60)).padStart(2, '0'),
          totalTime: Math.floor(progress.duration / 60) + ':' + String(Math.floor(progress.duration % 60)).padStart(2, '0')
        }
      };
    }).filter(Boolean); // Remove null entries

    // Apply pagination to the filtered results
    const totalValidLectures = lectureHistory.length;
    const totalPages = Math.ceil(totalValidLectures / parseInt(limit));
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLectures = lectureHistory.slice(skip, skip + parseInt(limit));

    console.log(`📊 Found ${paginatedLectures.length} of ${totalValidLectures} valid lecture history records for student: ${studentId}`);

    res.json({ 
      lectures: paginatedLectures,
      total: totalValidLectures,
      totalPages,
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < totalPages,
      hasPreviousPage: parseInt(page) > 1
    });
  } catch (error) {
    console.error("❌ Error fetching lecture history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// DEBUG: GET ALL PROGRESS FOR STUDENT
// ======================
router.get("/debug/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const allProgress = await WatchProgress.find({ studentId }).lean();

    res.json({ progress: allProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
