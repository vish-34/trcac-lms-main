import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SubmitAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [file, setFile] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      navigate("/studentdashboard/assignment");
      return;
    }
    
    fetchAssignment();
  }, [assignmentId, navigate]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      
      // Get assignment details
      const assignmentRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assignments/${assignmentId}`
      );
      
      setAssignment(assignmentRes.data.assignment);
      
      // Check if student has already submitted
      const submissionsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assignments/submissions/${assignmentId}`
      );
      
      const existingSubmission = submissionsRes.data.submissions.find(
        sub => sub.studentId === user?.id
      );
      
      if (existingSubmission) {
        setHasSubmitted(true);
      }
      
    } catch (err) {
      console.error(err);
      setError("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      
      setFile(droppedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a PDF file to submit");
      return;
    }

    try {
      setSubmitting(true);
      
      const data = new FormData();
      data.append("studentId", user?.id);
      data.append("studentName", user?.fullName || user?.email);
      data.append("studentEmail", user?.email);
      data.append("submissionFile", file);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/assignments/submit/${assignmentId}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSuccess(true);
      setHasSubmitted(true);
      setFile(null);
      
      // Track assignment submission activity
      import('../../utils/activityTracker.js').then(({ default: activityTracker }) => {
        activityTracker.trackAssignmentSubmission(assignmentId, assignment?.title, assignment?.subject);
      }).catch(err => console.log('Failed to track assignment submission:', err));
      
      // Reset file input
      const fileInput = document.getElementById('submission-file');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading assignment...</div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
        <div className="text-center py-12">
          <div className="text-red-500">Assignment not found</div>
          <button
            onClick={() => navigate("/studentdashboard/assignment")}
            className="mt-4 text-indigo-600 font-medium"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus(assignment.deadline);

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-14 md:pt-0 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/studentdashboard/assignment")}
          className="text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-flex items-center"
        >
          ← Back to Assignments
        </button>
        <h1 className="text-2xl font-semibold">Submit Assignment</h1>
      </div>

      {/* ASSIGNMENT DETAILS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 mb-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{assignment.title}</h2>
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
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-700 text-sm">{assignment.description}</p>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Assignment File</h3>
          <a
            href={`${import.meta.env.VITE_API_URL}${assignment.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Assignment PDF
          </a>
        </div>
      </motion.div>

      {/* SUBMISSION FORM */}
      {!hasSubmitted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Submit Your Work</h3>
          
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Assignment submitted successfully!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Submission File (PDF) *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="submission-file"
                    aria-label="Assignment submission file"
                    tabIndex="-1"
                  />
                  <label
                    htmlFor="submission-file"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`
                      flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${file 
                        ? 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100' 
                        : error
                        ? 'border-red-500 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                      }
                    `}
                    tabIndex="0"
                    role="button"
                    aria-label="Upload assignment submission file"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('submission-file').click();
                      }
                    }}
                  >
                    <div className="text-center">
                      {file ? (
                        <div className="flex items-center justify-center space-x-3">
                          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-left">
                            <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/studentdashboard/assignment")}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !file}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Submitted</h3>
            <p className="text-gray-600 mb-6">
              You have successfully submitted this assignment. You can view your submission status below.
            </p>
            <button
              onClick={() => navigate("/studentdashboard/assignment")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Assignments
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
