import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LectureHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);

  const lecturesPerPage = 20;

  useEffect(() => {
    fetchLectureHistory();
  }, [user, currentPage]);

  const fetchLectureHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/progress/history/${user?.id}`,
        { 
          params: { 
            page: currentPage, 
            limit: lecturesPerPage 
          } 
        }
      );

      setLectures(res.data.lectures || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalLectures(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching lecture history:", err);
      setError("Failed to fetch lecture history");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleContinueWatching = (lecture) => {
    if (lecture && lecture._id) {
      // Store resume data in localStorage for lectures page to use
      localStorage.setItem('resumeLectureData', JSON.stringify({
        lectureId: lecture._id,
        resumeTime: Math.floor(lecture.progress.currentTime),
        lectureTitle: lecture.title,
        subject: lecture.subject
      }));
      navigate(`/studentdashboard/lectures`);
    } else {
      navigate(`/studentdashboard/lectures`);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage === 100) return "bg-green-100 text-green-800";
    if (percentage >= 75) return "bg-blue-100 text-blue-800";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (percentage) => {
    if (percentage === 100) return "Completed";
    if (percentage >= 75) return "Almost Done";
    if (percentage >= 50) return "In Progress";
    return "Just Started";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lecture History</h1>
          <div className="text-sm text-gray-600">
            Showing {lectures.length} of {totalLectures} lectures (Page {currentPage} of {totalPages})
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Lectures List */}
      <div className="space-y-4">
        {lectures.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lecture History</h3>
            <p className="text-sm text-gray-500 mb-4">
              You haven't watched any lectures yet. Start learning to see your progress here!
            </p>
            <button
              onClick={() => navigate("/studentdashboard/lectures")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Lectures
            </button>
          </div>
        ) : (
          <>
            {lectures.map((lecture) => (
              <motion.div
                key={lecture._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Lecture Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {lecture.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{lecture.subject}</span>
                          <span className="text-gray-400">•</span>
                          <span>{lecture.facultyName}</span>
                          <span className="text-gray-400">•</span>
                          <span>{lecture.year} {lecture.course}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Last watched: {formatDate(lecture.progress.lastWatched)}</span>
                          <span className="text-gray-400">•</span>
                          <span>{lecture.progress.watchTime} / {lecture.progress.totalTime}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lecture.progress.percentageWatched)}`}>
                          {getStatusText(lecture.progress.percentageWatched)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="font-semibold">{lecture.progress.percentageWatched}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${lecture.progress.percentageWatched}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleContinueWatching(lecture)}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lecture.progress.percentageWatched === 100 ? 'Rewatch' : 'Continue'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white"
                              : "bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
