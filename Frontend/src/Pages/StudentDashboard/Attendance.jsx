import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Attendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalPages, setTotalPages] = useState(1);

  const fetchAttendance = async (page = 1, status = "all") => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status !== "all") {
        params.status = status;
      }

      const [attendanceRes, statsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/progress/attendance/${user.id}`, { params }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/progress/attendance-stats/${user.id}`)
      ]);

      setAttendance(attendanceRes.data.attendance || []);
      setAttendanceStats(statsRes.data);
      setTotalPages(attendanceRes.data.totalPages || 1);
      setCurrentPage(attendanceRes.data.currentPage || 1);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendance(currentPage, statusFilter);
    }
  }, [user, currentPage, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading && !attendance.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Attendance</h1>
        <p className="text-gray-600 mt-1">View your lecture attendance records</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ATTENDANCE STATISTICS */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-indigo-600">
              {attendanceStats.attendancePercentage}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Overall Attendance</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-green-600">
              {attendanceStats.presentLectures}
            </div>
            <div className="text-sm text-gray-600 mt-1">Present Lectures</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-red-600">
              {attendanceStats.absentLectures}
            </div>
            <div className="text-sm text-gray-600 mt-1">Absent Lectures</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-600">
              {attendanceStats.totalLectures}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Lectures</div>
          </div>
        </div>
      )}

      {/* SUBJECT-WISE ATTENDANCE */}
      {attendanceStats?.attendanceBySubject && attendanceStats.attendanceBySubject.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>
          <div className="space-y-3">
            {attendanceStats.attendanceBySubject.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{subject.subject}</div>
                  <div className="text-sm text-gray-600">
                    {subject.present} / {subject.total} lectures
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-semibold ${getProgressColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {subject.present} present, {subject.absent} absent
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subject.percentage >= 75 ? 'bg-green-500' :
                        subject.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({attendanceStats?.totalLectures || 0})
          </button>
          <button
            onClick={() => handleStatusFilter("present")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "present"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Present ({attendanceStats?.presentLectures || 0})
          </button>
          <button
            onClick={() => handleStatusFilter("absent")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "absent"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Absent ({attendanceStats?.absentLectures || 0})
          </button>
        </div>
      </div>

      {/* ATTENDANCE RECORDS */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading attendance records...</div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No attendance records found</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {attendance.map((record) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.lectureId?.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceColor(record.attendanceStatus)}`}>
                        {record.attendanceStatus}
                      </span>
                      {record.autoMarked && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Auto-marked
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Subject:</span> {record.lectureId?.subject}
                      </div>
                      <div>
                        <span className="font-medium">Teacher:</span> {record.lectureId?.facultyName}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(record.markedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {record.progress && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Watch Progress:</span>
                          <span className={`font-medium ${getProgressColor(record.progress.percentageWatched)}`}>
                            {record.progress.percentageWatched}% ({record.progress.watchTime} / {record.progress.totalTime})
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              record.progress.percentageWatched >= 75 ? 'bg-green-500' :
                              record.progress.percentageWatched >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${record.progress.percentageWatched}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ATTENDANCE POLICY INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Attendance Policy</h3>
        <div className="text-blue-800 space-y-1">
          <p>• Attendance is automatically marked when you watch 75% or more of a lecture video</p>
          <p>• You must maintain at least 75% overall attendance to be eligible for exams</p>
          <p>• Attendance is calculated based on video watch time, not just opening the video</p>
          <p>• Progress tracking includes anti-cheating measures to ensure fair attendance</p>
        </div>
      </div>
    </div>
  );
}
