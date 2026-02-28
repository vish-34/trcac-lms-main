import express from "express";
import StudentActivity from "../models/StudentActivity.js";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";

const router = express.Router();

// Helper function to get student model based on college
const getStudentModel = (college) => {
  return college === "Degree College" ? DCStudent : JCStudent;
};

// ======================
// TRACK STUDENT ACTIVITY
// ======================
router.post("/track", async (req, res) => {
  try {
    const {
      studentId,
      activityType,
      activityDetails,
      college,
      class: studentClass,
      userAgent,
      ipAddress
    } = req.body;

    if (!studentId || !activityType || !college || !studentClass) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get student information
    const StudentModel = getStudentModel(college);
    const student = await StudentModel.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const activity = new StudentActivity({
      studentId,
      studentName: student.fullName,
      studentEmail: student.email,
      activityType,
      activityDetails,
      college,
      class: studentClass,
      userAgent,
      ipAddress
    });

    await activity.save();

    res.status(201).json({
      message: "Activity tracked successfully",
      activity
    });

  } catch (error) {
    console.error("Error tracking activity:", error);
    res.status(500).json({ message: "Failed to track activity" });
  }
});

// ======================
// GET RECENT ACTIVITY FOR TEACHER
// ======================
router.get("/recent/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { limit = 20, activityType, college, class: studentClass } = req.query;

    // Build query
    const query = {};
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (college) {
      query.college = college;
    }
    
    if (studentClass) {
      query.class = studentClass;
    }

    // Get recent activities
    const activities = await StudentActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'fullName email')
      .lean();

    // Group activities by student for better display
    const groupedActivities = activities.reduce((acc, activity) => {
      const studentKey = activity.studentId._id.toString();
      
      if (!acc[studentKey]) {
        acc[studentKey] = {
          student: {
            id: activity.studentId._id,
            name: activity.studentId.fullName,
            email: activity.studentId.email
          },
          activities: [],
          lastActivity: activity.timestamp
        };
      }
      
      acc[studentKey].activities.push({
        id: activity._id,
        type: activity.activityType,
        details: activity.activityDetails,
        timestamp: activity.timestamp,
        college: activity.college,
        class: activity.class
      });
      
      // Update last activity if this one is more recent
      if (activity.timestamp > acc[studentKey].lastActivity) {
        acc[studentKey].lastActivity = activity.timestamp;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by last activity
    const result = Object.values(groupedActivities)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json({
      activities: result,
      total: result.length
    });

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// ======================
// GET ACTIVITY STATISTICS
// ======================
router.get("/stats/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { timeframe = '24h', college, class: studentClass } = req.query;

    // Calculate time range
    const now = new Date();
    let timeRange;
    
    switch (timeframe) {
      case '1h':
        timeRange = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = {
      timestamp: { $gte: timeRange }
    };
    
    if (college) {
      query.college = college;
    }
    
    if (studentClass) {
      query.class = studentClass;
    }

    // Get activity statistics
    const stats = await StudentActivity.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          activityType: '$_id',
          count: 1,
          uniqueStudentCount: { $size: '$uniqueStudents' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get overall statistics
    const totalStats = await StudentActivity.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' },
          avgActivitiesPerStudent: { $avg: 1 }
        }
      },
      {
        $project: {
          totalActivities: 1,
          uniqueStudentCount: { $size: '$uniqueStudents' },
          avgActivitiesPerStudent: { $round: ['$avgActivitiesPerStudent', 2] }
        }
      }
    ]);

    // Get hourly activity distribution for the last 24 hours
    const hourlyStats = await StudentActivity.aggregate([
      { $match: { ...query, timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      timeframe,
      activityStats: stats,
      totalStats: totalStats[0] || { totalActivities: 0, uniqueStudentCount: 0, avgActivitiesPerStudent: 0 },
      hourlyStats,
      generatedAt: now
    });

  } catch (error) {
    console.error("Error fetching activity stats:", error);
    res.status(500).json({ message: "Failed to fetch activity statistics" });
  }
});

// ======================
// GET STUDENT ACTIVITY HISTORY
// ======================
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50, activityType, startDate, endDate } = req.query;

    // Build query
    const query = { studentId };
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await StudentActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      activities,
      total: activities.length
    });

  } catch (error) {
    console.error("Error fetching student activity:", error);
    res.status(500).json({ message: "Failed to fetch student activity" });
  }
});

// ======================
// GET STUDENT ATTENDANCE (BASED ON LECTURE WATCH PERCENTAGE)
// ======================
router.get("/attendance/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all lecture viewing activities for this student
    const lectureActivities = await StudentActivity.find({
      studentId,
      activityType: "lecture_viewed"
    }).lean();

    if (lectureActivities.length === 0) {
      return res.json({
        attendance: 0,
        totalLectures: 0,
        watchedLectures: 0,
        averageWatchPercentage: 0,
        message: "No lecture activities found"
      });
    }

    // Calculate attendance based on average watch percentage
    let totalWatchPercentage = 0;
    let watchedLectures = 0;
    const lectureDetails = [];

    for (const activity of lectureActivities) {
      const watchPercentage = activity.activityDetails?.watchPercentage || 0;
      totalWatchPercentage += watchPercentage;
      
      if (watchPercentage > 0) {
        watchedLectures++;
      }

      lectureDetails.push({
        lectureId: activity.activityDetails?.lectureId,
        lectureTitle: activity.activityDetails?.lectureTitle,
        lectureSubject: activity.activityDetails?.lectureSubject,
        watchPercentage,
        watchDuration: activity.activityDetails?.watchDuration,
        totalDuration: activity.activityDetails?.totalDuration,
        timestamp: activity.timestamp
      });
    }

    const averageWatchPercentage = Math.round(totalWatchPercentage / lectureActivities.length);
    const attendance = averageWatchPercentage; // Attendance = average watch percentage

    res.json({
      attendance,
      totalLectures: lectureActivities.length,
      watchedLectures,
      averageWatchPercentage,
      lectureDetails,
      message: `Attendance calculated based on ${lectureActivities.length} lecture views`
    });

  } catch (error) {
    console.error("Error calculating attendance:", error);
    res.status(500).json({ message: "Failed to calculate attendance" });
  }
});

export default router;
