import express from "express";
import User from "../models/User.js";
import DCStudent from "../models/DCStudent.js";
import JCStudent from "../models/JCStudent.js";
import DCTeacher from "../models/DCTeacher.js";
import JCTeacher from "../models/JCTeacher.js";
import Lecture from "../models/Lecture.js";
import Assignment from "../models/Assignment.js";
import Attendance from "../models/Attendance.js";
import StudentActivity from "../models/StudentActivity.js";

const router = express.Router();

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getClassLectureFilter = (className) => {
  if (!className) return null;

  if (className === "FYJC" || className === "SYJC") {
    return {
      college: "Junior College",
      year: className.slice(0, 2),
    };
  }

  const year = className.slice(0, 2);
  const degreeCode = className.slice(2);
  const degreeMap = {
    BScCS: "B.Sc (CS)",
    BMS: "BMS",
    BCom: "BCom",
    BAF: "BAF",
  };

  if (!degreeMap[degreeCode]) {
    return null;
  }

  return {
    college: "Degree College",
    year,
    degree: degreeMap[degreeCode],
  };
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now - activityTime;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

router.get("/dashboard-summary", async (req, res) => {
  try {
    const startOfToday = getStartOfToday();

    const [
      dcStudents,
      jcStudents,
      dcTeachers,
      jcTeachers,
      lectures,
      assignments,
      attendanceRecords,
      recentActivities,
    ] = await Promise.all([
      DCStudent.find().select("_id class"),
      JCStudent.find().select("_id class"),
      DCTeacher.find().select("_id"),
      JCTeacher.find().select("_id"),
      Lecture.find().select("_id title subject facultyName college degree year createdAt").sort({ createdAt: -1 }),
      Assignment.find().select("title subject teacherName submissions createdAt").sort({ createdAt: -1 }),
      Attendance.find().select("studentId attendanceStatus"),
      StudentActivity.find()
        .select("studentName activityType activityDetails timestamp")
        .sort({ timestamp: -1 })
        .limit(10),
    ]);

    const students = [...dcStudents, ...jcStudents];
    const totalFaculty = dcTeachers.length + jcTeachers.length;
    const totalStudents = students.length;
    const lecturesConducted = lectures.length;
    const lecturesUpdatedToday = lectures.filter((lecture) => new Date(lecture.createdAt) >= startOfToday).length;

    const assignmentsSubmitted = assignments.reduce(
      (total, assignment) => total + (assignment.submissions?.length || 0),
      0
    );

    const pendingReviews = assignments.reduce(
      (total, assignment) =>
        total +
        (assignment.submissions || []).filter(
          (submission) => submission.status === "submitted" && !submission.reviewedAt
        ).length,
      0
    );

    const presentCount = attendanceRecords.filter(
      (record) => record.attendanceStatus === "present"
    ).length;
    const avgAttendance =
      attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    const studentsByClass = students.reduce((acc, student) => {
      if (!student.class) return acc;
      acc[student.class] = (acc[student.class] || 0) + 1;
      return acc;
    }, {});

    const courseOverview = Object.entries(studentsByClass)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([className, studentCount]) => {
        const lectureFilter = getClassLectureFilter(className);
        let facultyCount = 0;

        if (lectureFilter) {
          const matchingLectures = lectures.filter((lecture) =>
            Object.entries(lectureFilter).every(([key, value]) => lecture[key] === value)
          );
          facultyCount = new Set(matchingLectures.map((lecture) => lecture.facultyName).filter(Boolean)).size;
        }

        return {
          course: className,
          students: studentCount,
          faculty: facultyCount,
        };
      });

    const studentClassMap = students.reduce((acc, student) => {
      acc[String(student._id)] = student.class;
      return acc;
    }, {});

    const attendanceByClass = attendanceRecords.reduce((acc, record) => {
      const className = studentClassMap[String(record.studentId)];
      if (!className) return acc;

      if (!acc[className]) {
        acc[className] = { total: 0, present: 0 };
      }

      acc[className].total += 1;
      if (record.attendanceStatus === "present") {
        acc[className].present += 1;
      }

      return acc;
    }, {});

    const attendanceAlerts = Object.entries(attendanceByClass)
      .map(([className, stats]) => ({
        className,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }))
      .filter((item) => item.percentage > 0 && item.percentage < 75)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 2)
      .map((item) => `Attendance below 75% in ${item.className} (${item.percentage}%)`);

    const alerts = [
      ...attendanceAlerts,
      ...(pendingReviews > 0 ? [`${pendingReviews} assignment review${pendingReviews > 1 ? "s" : ""} pending`] : []),
      ...(lecturesUpdatedToday > 0 ? [`${lecturesUpdatedToday} lecture${lecturesUpdatedToday > 1 ? "s" : ""} updated today`] : []),
    ].slice(0, 3);

    const lectureActivities = lectures.slice(0, 3).map((lecture) => ({
      text: `${lecture.facultyName} uploaded ${lecture.title}`,
      timestamp: lecture.createdAt,
    }));

    const assignmentActivities = assignments
      .flatMap((assignment) =>
        (assignment.submissions || []).map((submission) => ({
          text: `${submission.studentName} submitted ${assignment.title}`,
          timestamp: submission.submittedAt || assignment.createdAt,
        }))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);

    const studentRecentActivities = recentActivities.slice(0, 3).map((activity) => {
      let text = `${activity.studentName} performed an activity`;

      if (activity.activityType === "lecture_viewed") {
        text = `${activity.studentName} watched ${activity.activityDetails?.lectureTitle || "a lecture"}`;
      } else if (activity.activityType === "assignment_submitted") {
        text = `${activity.studentName} submitted ${activity.activityDetails?.assignmentTitle || "an assignment"}`;
      } else if (activity.activityType === "assignment_downloaded") {
        text = `${activity.studentName} downloaded ${activity.activityDetails?.assignmentTitle || "an assignment"}`;
      } else if (activity.activityType === "login") {
        text = `${activity.studentName} logged in`;
      }

      return {
        text,
        timestamp: activity.timestamp,
      };
    });

    const recentActivity = [...lectureActivities, ...assignmentActivities, ...studentRecentActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map((item) => ({
        text: item.text,
        time: formatTimeAgo(item.timestamp),
      }));

    res.json({
      stats: {
        totalFaculty,
        totalStudents,
        avgAttendance,
        lecturesConducted,
        lecturesUpdatedToday,
        assignmentsSubmitted,
        pendingReviews,
      },
      courseOverview,
      alerts,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard summary:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard summary" });
  }
});

/* ===================================================
   GET ALL TEACHERS
=================================================== */
router.get("/teachers", async (req, res) => {
  try {
    const dcTeachers = await DCTeacher.find().select("-password");
    const jcTeachers = await JCTeacher.find().select("-password");

    const teachers = [
      ...dcTeachers.map((t) => ({ ...t.toObject(), college: "Degree College" })),
      ...jcTeachers.map((t) => ({ ...t.toObject(), college: "Junior College" })),
    ];

    res.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
});

/* ===================================================
   GET ALL STUDENTS
=================================================== */
router.get("/students", async (req, res) => {
  try {
    const dcStudents = await DCStudent.find().select("-password");
    const jcStudents = await JCStudent.find().select("-password");

    const students = [
      ...dcStudents.map((s) => ({ ...s.toObject(), college: "Degree College" })),
      ...jcStudents.map((s) => ({ ...s.toObject(), college: "Junior College" })),
    ];

    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

/* ===================================================
   DELETE TEACHER
=================================================== */
router.delete("/teachers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const dcResult = await DCTeacher.findByIdAndDelete(id);
    const jcResult = await JCTeacher.findByIdAndDelete(id);

    if (!dcResult && !jcResult) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ message: "Failed to delete teacher" });
  }
});

/* ===================================================
   DELETE STUDENT
=================================================== */
router.delete("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const dcResult = await DCStudent.findByIdAndDelete(id);
    const jcResult = await JCStudent.findByIdAndDelete(id);

    if (!dcResult && !jcResult) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

export default router;
