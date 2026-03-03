import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); // Store all assignments for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // New filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, not-submitted, submitted, graded, overdue
  const [deadlineFilter, setDeadlineFilter] = useState("all"); // all, overdue, today, week, month
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, deadline-soonest, deadline-latest, title
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assignments/student/${user?.id}`
      );
      
      console.log('Student assignments response:', res.data);
      
      const fetchedAssignments = res.data.assignments || [];
      setAllAssignments(fetchedAssignments); // Store all assignments for filtering
      
      setAssignments(fetchedAssignments);
      
      // Set student info if available
      if (res.data.studentInfo) {
        console.log('Student info:', res.data.studentInfo);
      }
      
      // The backend already provides submissionStatus, so we don't need separate API calls
      // Just log the status for debugging
      fetchedAssignments.forEach(assignment => {
        console.log(`� Assignment ${assignment._id} status from backend: ${assignment.submissionStatus}`);
      });
      
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "overdue", text: `Overdue by ${Math.abs(diffDays)} days`, color: "text-red-600" };
    } else if (diffDays === 0) {
      // Check if deadline time has passed today
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours < 0) {
        return { status: "overdue", text: "Overdue", color: "text-red-600" };
      } else if (diffHours <= 2) {
        return { status: "urgent", text: "Due today (within 2 hours)", color: "text-red-600" };
      } else {
        return { status: "today", text: "Due today", color: "text-orange-600" };
      }
    } else if (diffDays === 1) {
      return { status: "tomorrow", text: "Due tomorrow", color: "text-yellow-600" };
    } else if (diffDays <= 3) {
      return { status: "soon", text: `Due in ${diffDays} days`, color: "text-yellow-600" };
    } else {
      return { status: "plenty", text: `Due in ${diffDays} days`, color: "text-blue-600" };
    }
  };

  // =======================
  // FILTERING & SORTING LOGIC
  // =======================

  // Get unique values for filters
  const getUniqueSubjects = () => {
    const subjects = [...new Set(allAssignments.map(assignment => assignment.subject).filter(Boolean))];
    return subjects.sort();
  };

  const getUniqueTeachers = () => {
    const teachers = [...new Set(allAssignments.map(assignment => assignment.teacherName).filter(Boolean))];
    return teachers.sort();
  };

  const getUniqueClasses = () => {
    const classes = [...new Set(allAssignments.map(assignment => assignment.class).filter(Boolean))];
    return classes.sort();
  };

  const getUniqueFileTypes = () => {
    const fileTypes = [...new Set(allAssignments.map(assignment => assignment.fileType).filter(Boolean))];
    return fileTypes.sort();
  };

  // Get assignment status based on submission and deadline
  const getAssignmentStatus = (assignment) => {
    const backendStatus = assignment.submissionStatus;
    const deadlineStatus = getDeadlineStatus(assignment.deadline);
    
    console.log(`Getting status for assignment ${assignment._id}:`, {
      backendStatus,
      deadlineStatus: deadlineStatus.status
    });
    
    // Use backend status first, then check deadline for overdue assignments
    if (backendStatus === 'submitted' || backendStatus === 'graded') {
      return backendStatus;
    }
    
    if (deadlineStatus.status === 'overdue') return 'overdue';
    return 'not-submitted';
  };

  // Check if assignment matches deadline filter
  const matchesDeadlineFilter = (assignment, filter) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (filter) {
      case 'overdue':
        return diffDays < 0;
      case 'today':
        return diffDays === 0;
      case 'week':
        return diffDays >= 0 && diffDays <= 7;
      case 'month':
        return diffDays >= 0 && diffDays <= 30;
      default:
        return true;
    }
  };

  // Filter and sort assignments
  const getFilteredAndSortedAssignments = () => {
    let filtered = [...allAssignments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(query) ||
        assignment.subject.toLowerCase().includes(query) ||
        assignment.teacherName.toLowerCase().includes(query) ||
        (assignment.description && assignment.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      console.log(`Filtering by status: ${statusFilter}`);
      const beforeFilter = filtered.length;
      filtered = filtered.filter(assignment => {
        const status = getAssignmentStatus(assignment);
        console.log(`Assignment ${assignment._id} status: ${status}`);
        return status === statusFilter;
      });
      console.log(`Status filter result: ${beforeFilter} -> ${filtered.length} assignments`);
    }

    // Deadline filter
    if (deadlineFilter !== 'all') {
      filtered = filtered.filter(assignment => matchesDeadlineFilter(assignment, deadlineFilter));
    }

    // Subject filter
    if (subjectFilter) {
      filtered = filtered.filter(assignment => assignment.subject === subjectFilter);
    }

    // Teacher filter
    if (teacherFilter) {
      filtered = filtered.filter(assignment => assignment.teacherName === teacherFilter);
    }

    // Class filter
    if (classFilter) {
      filtered = filtered.filter(assignment => assignment.class === classFilter);
    }

    // College filter
    if (collegeFilter) {
      filtered = filtered.filter(assignment => assignment.college === collegeFilter);
    }

    // File type filter
    if (fileTypeFilter) {
      filtered = filtered.filter(assignment => assignment.fileType === fileTypeFilter);
    }

    // Sort assignments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'deadline-soonest':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'deadline-latest':
          return new Date(b.deadline) - new Date(a.deadline);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    console.log(`Applying filters - dependencies changed:`, {
      allAssignmentsLength: allAssignments.length,
      searchQuery,
      statusFilter,
      deadlineFilter,
      sortBy,
      subjectFilter,
      teacherFilter,
      classFilter,
      collegeFilter,
      fileTypeFilter
    });
    
    const filtered = getFilteredAndSortedAssignments();
    console.log(`Filtered result: ${filtered.length} assignments`);
    setAssignments(filtered);
  }, [allAssignments, searchQuery, statusFilter, deadlineFilter, sortBy, subjectFilter, teacherFilter, classFilter, collegeFilter, fileTypeFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDeadlineFilter("all");
    setSortBy("newest");
    setSubjectFilter("");
    setTeacherFilter("");
    setClassFilter("");
    setCollegeFilter("");
    setFileTypeFilter("");
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "all") count++;
    if (deadlineFilter !== "all") count++;
    if (subjectFilter) count++;
    if (teacherFilter) count++;
    if (classFilter) count++;
    if (collegeFilter) count++;
    if (fileTypeFilter) count++;
    return count;
  };

  const handleSubmitAssignment = (assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (deadline < now) {
      setSubmissionError("This assignment is overdue and cannot be submitted");
      setTimeout(() => setSubmissionError(""), 3000);
      return;
    }
    
    // Check if already submitted
    if (assignment.submissionStatus === 'submitted' || assignment.submissionStatus === 'graded') {
      setSubmissionError("You have already submitted this assignment");
      setTimeout(() => setSubmissionError(""), 3000);
      return;
    }
    
    // Navigate to submission page
    navigate(`/studentdashboard/assignment/submit/${assignment._id}`);
  };

  const downloadAssignment = async (assignment) => {
    try {
      // Track assignment download activity
      import('../../utils/activityTracker.js').then(({ default: activityTracker }) => {
        activityTracker.trackAssignmentDownload(assignment._id, assignment.title, assignment.subject);
      }).catch(err => console.log('Failed to track assignment download:', err));

      // Create download link
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_API_URL}${assignment.fileUrl}`;
      link.download = assignment.fileName || 'assignment.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading assignment:', error);
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Assignments</h1>
        <p className="text-gray-600 mt-1">View and download your assignments</p>
      </div>

      {/* ENHANCED FILTERING SECTION */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Search and Quick Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments, subjects, or teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="not-submitted">Not Submitted</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Deadline Filter */}
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline-soonest">Most Upcoming Deadline</option>
            <option value="deadline-latest">Least Upcoming Deadline</option>
            <option value="title">Title A-Z</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Status: {statusFilter.replace('-', ' ')}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {deadlineFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Deadline: {deadlineFilter.replace('-', ' ')}
                <button
                  onClick={() => setDeadlineFilter("all")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {subjectFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Subject: {subjectFilter}
                <button
                  onClick={() => setSubjectFilter("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {teacherFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Teacher: {teacherFilter}
                <button
                  onClick={() => setTeacherFilter("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {classFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Class: {classFilter}
                <button
                  onClick={() => setClassFilter("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {collegeFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                College: {collegeFilter}
                <button
                  onClick={() => setCollegeFilter("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            {fileTypeFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                File Type: {fileTypeFilter}
                <button
                  onClick={() => setFileTypeFilter("")}
                  className="ml-1 hover:text-indigo-600"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Subjects</option>
                    {getUniqueSubjects().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Teacher Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Teachers</option>
                    {getUniqueTeachers().map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                {/* Class Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Classes</option>
                    {getUniqueClasses().map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {/* College Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Colleges</option>
                    <option value="Junior College">Junior College</option>
                    <option value="Degree College">Degree College</option>
                  </select>
                </div>

                {/* File Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All File Types</option>
                    {getUniqueFileTypes().map(fileType => (
                      <option key={fileType} value={fileType}>{fileType}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="text-sm text-gray-600 border-t pt-3">
          Showing {assignments.length} of {allAssignments.length} assignments
          {getActiveFiltersCount() > 0 && ` • ${getActiveFiltersCount()} filter${getActiveFiltersCount() > 1 ? 's' : ''} applied`}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {submissionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {submissionError}
        </div>
      )}

      {/* ASSIGNMENTS LIST */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading assignments...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500">{error}</div>
          <button
            onClick={fetchAssignments}
            className="mt-4 text-indigo-600 font-medium"
          >
            Try Again
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No assignments available</div>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const deadlineStatus = getDeadlineStatus(assignment.deadline);
            
            return (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{assignment.subject}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deadlineStatus.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    deadlineStatus.status === 'urgent' ? 'bg-red-100 text-red-800' :
                    deadlineStatus.status === 'today' ? 'bg-orange-100 text-orange-800' :
                    deadlineStatus.status === 'tomorrow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {deadlineStatus.text}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Teacher:</span> {assignment.teacherName}
                  </div>
                  <div>
                    <span className="font-medium">Class:</span> {assignment.class}
                  </div>
                  <div>
                    <span className="font-medium">College:</span> {assignment.college}
                  </div>
                  <div className="md:col-span-3">
                    <span className="font-medium">Deadline:</span>{" "}
                    <span className={deadlineStatus.color}>
                      {new Date(assignment.deadline).toLocaleDateString()} at {new Date(assignment.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                {assignment.description && (
                  <p className="text-gray-700 mb-4 text-sm">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Posted: {new Date(assignment.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmitAssignment(assignment)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Submit Assignment
                    </button>
                    <button
                      onClick={() => downloadAssignment(assignment)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
