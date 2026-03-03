import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Exams() {

  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredExams, setFilteredExams] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    examType: 'all',
    status: 'all',
    subject: 'all',
    dateRange: 'all',
    duration: 'all',
    marksRange: 'all'
  });

  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });

  /* ================= FETCH EXAMS ================= */

  useEffect(() => {
    fetchStudentExams();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [exams, filters]);

  const applyFilters = () => {
    let filtered = [...exams];
    
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchLower) ||
        exam.subject.toLowerCase().includes(searchLower) ||
        exam.teacherName.toLowerCase().includes(searchLower) ||
        exam.instructions?.toLowerCase().includes(searchLower)
      );
    }
    
    // Exam type filter
    if (filters.examType !== 'all') {
      filtered = filtered.filter(exam => exam.examType === filters.examType);
    }
    
    // Status filter
    if (filters.status !== 'all') {
      const now = new Date();
      if (filters.status === 'upcoming') {
        filtered = filtered.filter(exam => new Date(exam.examDate) > now);
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(exam => new Date(exam.examDate) <= now);
      }
    }
    
    // Subject filter
    if (filters.subject !== 'all') {
      filtered = filtered.filter(exam => exam.subject === filters.subject);
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      let endDate;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'next30':
          startDate = now;
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate && endDate) {
        filtered = filtered.filter(exam => {
          const examDate = new Date(exam.examDate);
          return examDate >= startDate && examDate < endDate;
        });
      }
    }
    
    // Duration filter
    if (filters.duration !== 'all') {
      switch (filters.duration) {
        case 'short':
          filtered = filtered.filter(exam => exam.duration <= 60);
          break;
        case 'medium':
          filtered = filtered.filter(exam => exam.duration > 60 && exam.duration <= 120);
          break;
        case 'long':
          filtered = filtered.filter(exam => exam.duration > 120);
          break;
      }
    }
    
    // Marks range filter
    if (filters.marksRange !== 'all') {
      switch (filters.marksRange) {
        case 'low':
          filtered = filtered.filter(exam => exam.totalMarks <= 50);
          break;
        case 'medium':
          filtered = filtered.filter(exam => exam.totalMarks > 50 && exam.totalMarks <= 100);
          break;
        case 'high':
          filtered = filtered.filter(exam => exam.totalMarks > 100);
          break;
      }
    }
    
    setFilteredExams(filtered);
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(exams.map(exam => exam.subject))];
    return subjects.sort();
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      examType: 'all',
      status: 'all',
      subject: 'all',
      dateRange: 'all',
      duration: 'all',
      marksRange: 'all'
    });
  };

  const fetchStudentExams = async () => {

    try {

      setLoading(true);

      // 👇 Backend should filter using student data
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/exams/student/${user?.id}`
      );

      const examsData = res.data.exams || [];

      setExams(examsData);

      const now = new Date();

      const total = examsData.length;

      const upcoming = examsData.filter(
        exam => new Date(exam.examDate) > now
      ).length;

      const completed = examsData.filter(
        exam => new Date(exam.examDate) <= now
      ).length;

      setStats({
        total,
        upcoming,
        completed
      });

    } catch (err) {

      console.error(err);
      setError("Failed to fetch exams");

    } finally {

      setLoading(false);

    }

  };

  /* ================= HELPERS ================= */

  const formatDateTime = (dateString) => {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  };

  const getExamStatus = (examDate) => {

    const now = new Date();
    const exam = new Date(examDate);

    if (exam <= now) {

      return {
        status: "Completed",
        color: "bg-green-100 text-green-700"
      };

    }

    return {
      status: "Upcoming",
      color: "bg-yellow-100 text-yellow-700"
    };

  };

  const getExamTypeColor = (examType) => {

    switch (examType) {

      case "midterm":
        return "bg-blue-100 text-blue-800";

      case "final":
        return "bg-red-100 text-red-800";

      case "quiz":
        return "bg-green-100 text-green-800";

      case "practical":
        return "bg-purple-100 text-purple-800";

      case "assignment":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-gray-100 text-gray-800";
    }

  };

  /* ================= UI ================= */

  return (

    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h1 className="text-xl sm:text-2xl font-semibold">

          My Exams

        </h1>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <StatCard
          title="Total Exams"
          value={stats.total}
          color="bg-indigo-100"
        />

        <StatCard
          title="Upcoming"
          value={`${stats.upcoming} Scheduled`}
          color="bg-yellow-100"
        />

        <StatCard
          title="Completed"
          value={`${stats.completed} Finished`}
          color="bg-green-100"
        />

      </div>

      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">

          {error}

        </div>

      )}

      {/* FILTERS SECTION */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filter Exams</h2>
          <button
            onClick={resetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Reset All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by title, subject, teacher..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
            <select
              value={filters.examType}
              onChange={(e) => setFilters({...filters, examType: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="practical">Practical</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({...filters, subject: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Subjects</option>
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="next30">Next 30 Days</option>
            </select>
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={filters.duration}
              onChange={(e) => setFilters({...filters, duration: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (&le; 1 hour)</option>
              <option value="medium">Medium (1-2 hours)</option>
              <option value="long">Long (&gt; 2 hours)</option>
            </select>
          </div>
          
          {/* Marks Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
            <select
              value={filters.marksRange}
              onChange={(e) => setFilters({...filters, marksRange: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Marks</option>
              <option value="low">Low (&le; 50)</option>
              <option value="medium">Medium (51-100)</option>
              <option value="high">High (&gt; 100)</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters Display */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Search: {filters.searchTerm}
              <button
                onClick={() => setFilters({...filters, searchTerm: ''})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.examType !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Type: {filters.examType}
              <button
                onClick={() => setFilters({...filters, examType: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Status: {filters.status}
              <button
                onClick={() => setFilters({...filters, status: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.subject !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Subject: {filters.subject}
              <button
                onClick={() => setFilters({...filters, subject: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateRange !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Date: {filters.dateRange}
              <button
                onClick={() => setFilters({...filters, dateRange: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.duration !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Duration: {filters.duration}
              <button
                onClick={() => setFilters({...filters, duration: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.marksRange !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Marks: {filters.marksRange}
              <button
                onClick={() => setFilters({...filters, marksRange: 'all'})}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredExams.length} of {exams.length} exams
        </div>
      </div>

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="bg-white rounded-xl shadow overflow-hidden"

      >

        {loading ? (

          <div className="p-8">

            <div className="animate-pulse space-y-4">

              {[1, 2, 3].map(i => (

                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded"
                />

              ))}

            </div>

          </div>

        ) : filteredExams.length === 0 ? (

          <div className="text-center py-12">

            <h3 className="font-medium">

              {exams.length === 0 ? 'No Exams Available' : 'No Exams Match Your Filters'}

            </h3>

            <p className="text-sm text-gray-500 mt-1">

              {exams.length === 0 
                ? 'Your teacher hasn\'t scheduled exams yet.' 
                : 'Try adjusting your filters to see more results.'
              }

            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[900px] w-full text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">

                <tr>

                  <th className="p-4">Exam</th>

                  <th>Subject</th>

                  <th>Date & Time</th>

                  <th>Duration</th>

                  <th>Type</th>

                  <th>Status</th>

                  <th className="pr-4">Paper</th>

                </tr>

              </thead>

              <tbody>

                {filteredExams.map(exam => {

                  const examStatus =
                    getExamStatus(exam.examDate);

                  return (

                    <tr
                      key={exam._id}
                      className="border-t hover:bg-gray-50"
                    >

                      {/* TITLE */}

                      <td className="p-4">

                        <div className="font-medium">

                          {exam.title}

                        </div>

                        {exam.instructions && (

                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">

                            {exam.instructions}

                          </div>

                        )}

                      </td>

                      {/* SUBJECT */}

                      <td>

                        <div>

                          {exam.subject}

                        </div>

                        <div className="text-xs text-gray-500">

                          {exam.class}

                        </div>

                      </td>

                      <td>

                        {formatDateTime(exam.examDate)}

                      </td>

                      <td>

                        {exam.duration} min

                      </td>

                      {/* TYPE */}

                      <td>

                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getExamTypeColor(
                            exam.examType
                          )}`}
                        >

                          {exam.examType}

                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`px-3 py-1 rounded-full text-xs ${examStatus.color}`}
                        >

                          {examStatus.status}

                        </span>

                      </td>

                      {/* VIEW */}

                      <td className="pr-4">

                        {exam.fileUrl ? (

                          <a

                            href={`${import.meta.env.VITE_API_URL}${exam.fileUrl}`}

                            target="_blank"

                            rel="noopener noreferrer"

                            className="text-indigo-600 hover:text-indigo-800 font-medium"

                          >

                            View Paper

                          </a>

                        ) : (

                          <span className="text-gray-400 text-xs">

                            No File

                          </span>

                        )}

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </motion.div>

    </div>

  );

}

/* ================= STAT CARD ================= */

function StatCard({ title, value, color }) {

  return (

    <div className={`${color} rounded-xl p-5`}>

      <p className="text-sm text-gray-600">

        {title}

      </p>

      <h2 className="text-xl font-semibold mt-2">

        {value}

      </h2>

    </div>

  );

}