import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [studentSubmissions, setStudentSubmissions] = useState({});
  
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
      
      setAssignments(res.data.assignments || []);
      
      // Set student info if available
      if (res.data.studentInfo) {
        console.log('Student info:', res.data.studentInfo);
      }
      
      // Fetch submission status for each assignment
      const submissionsData = {};
      await Promise.all(
        res.data.assignments.map(async (assignment) => {
          try {
            const submissionsRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/assignments/submissions/${assignment._id}`
            );
            const studentSubmission = submissionsRes.data.submissions.find(
              sub => sub.studentId === user?.id
            );
            submissionsData[assignment._id] = studentSubmission || null;
          } catch (err) {
            submissionsData[assignment._id] = null;
          }
        })
      );
      setStudentSubmissions(submissionsData);
      
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
      return { status: "plenty", text: `Due in ${diffDays} days`, color: "text-green-600" };
    }
  };

  const getSubmissionStatus = (assignment) => {
    // Use the submissionStatus from backend if available, otherwise check local state
    if (assignment.submissionStatus) {
      if (assignment.submissionStatus === 'submitted') {
        return {
          status: "submitted",
          text: "Submitted",
          color: "text-green-600",
          bgColor: "bg-green-100"
        };
      } else if (assignment.submissionStatus === 'overdue') {
        return {
          status: "overdue",
          text: "Overdue",
          color: "text-red-600",
          bgColor: "bg-red-100"
        };
      }
    }
    
    // Fallback to local state
    if (studentSubmissions[assignment._id]) {
      return {
        status: "submitted",
        text: "Submitted",
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    }
    
    // Check if overdue
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (deadline < now) {
      return {
        status: "overdue",
        text: "Overdue",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    }
    
    return {
      status: "pending",
      text: "Pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    };
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
    if (studentSubmissions[assignment._id]) {
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
