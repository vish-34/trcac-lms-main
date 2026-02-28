import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  
  // Submissions modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionStats, setSubmissionStats] = useState(null);
  
  // PDF viewer state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    deadline: "",
    class: "",
    college: ""
  });

  // Class options based on college type
  const classOptions = {
    "Junior College": ["FYJC", "SYJC"],
    "Degree College": [
      "FYBScCS", "SYBScCS", "TYBScCS",
      "FYBMS", "SYBMS", "TYBMS",
      "FYBCom", "SYBCom", "TYBCom",
      "FYBAF", "SYBAF", "TYBAF"
    ]
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assignments/teacher/${user?.id}`
      );
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    } else if (!/^[a-zA-Z0-9\s\-_.,!?()[\]{}:;'"\/\\]+$/.test(formData.title.trim())) {
      newErrors.title = "Title contains invalid characters";
    }
    
    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length > 100) {
      newErrors.subject = "Subject cannot exceed 100 characters";
    } else if (!/^[a-zA-Z0-9\s\-_.,!?()[\]{}:;'"\/\\]+$/.test(formData.subject.trim())) {
      newErrors.subject = "Subject contains invalid characters";
    }
    
    // Class validation
    if (!formData.class.trim()) {
      newErrors.class = "Class is required";
    } else if (formData.class.trim().length > 20) {
      newErrors.class = "Class cannot exceed 20 characters";
    } else if (!/^[A-Za-z0-9\s\-_]+$/.test(formData.class.trim())) {
      newErrors.class = "Class can only contain letters, numbers, spaces, hyphens, and underscores";
    }
    
    // College validation
    if (!formData.college) {
      newErrors.college = "College type is required";
    }
    
    // Deadline validation
    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }
    
    // Description validation (optional)
    if (formData.description && formData.description.trim().length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    } else if (formData.description && !/^[a-zA-Z0-9\s\-_.,!?()[\]{}:;'"\/\\@#$%&*+=<>\n\r]+$/.test(formData.description.trim())) {
      newErrors.description = "Description contains invalid characters";
    }
    
    // File validation
    if (!file && !editingAssignment) {
      newErrors.file = "Assignment file is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    console.log('Submitting assignment with data:', formData);
    console.log('User info:', user);
    console.log('File:', file);

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("subject", formData.subject.trim());
    data.append("teacherId", user?.id);
    data.append("teacherName", user?.fullName || user?.email);
    data.append("deadline", formData.deadline);
    data.append("class", formData.class.trim());
    data.append("college", formData.college);
    data.append("assignmentFile", file);

    console.log('FormData contents:');
    for (let [key, value] of data.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      setUploading(true);
      
      if (editingAssignment) {
        // Update existing assignment
        data.append("assignmentId", editingAssignment._id);
        console.log('Updating assignment:', editingAssignment._id);
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/assignments/${editingAssignment._id}`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
      } else {
        // Create new assignment
        console.log('Creating new assignment...');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/assignments/create`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
        console.log('Assignment creation response:', response.data);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        subject: "",
        deadline: "",
        class: "",
        college: ""
      });
      setFile(null);
      setShowForm(false);
      setEditingAssignment(null);
      setErrors({});
      
      // Refresh assignments
      await fetchAssignments();
      
    } catch (err) {
      console.error("Assignment creation error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.missing) {
        setError("Please fill in all required fields");
        console.log("Missing fields:", err.response.data.missing);
      } else {
        setError("Failed to create assignment. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      subject: assignment.subject,
      deadline: new Date(assignment.deadline).toISOString().slice(0, 16),
      class: assignment.class,
      college: assignment.college
    });
    setFile(null);
    setShowForm(true);
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assignments/submissions/${assignment._id}`
      );
      setSubmissions(res.data.submissions);
      setSubmissionStats(res.data.stats);
      setShowSubmissions(true);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch submissions");
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/assignments/${assignmentId}`
      );
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      setError("Failed to delete assignment");
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowPdfViewer(true);
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setSelectedSubmission(null);
  };

  const closeSubmissionsModal = () => {
    setShowSubmissions(false);
    setSelectedAssignment(null);
    setSubmissions([]);
    setSubmissionStats(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      deadline: "",
      class: "",
      college: ""
    });
    setErrors({});
    setFile(null);
    setEditingAssignment(null);
    setShowForm(false);
    setError("");
    
    // Reset file input
    const fileInput = document.getElementById('assignment-file');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold">Assignments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Create Assignment
        </button>
      </div>

      {/* CREATE/EDIT FORM */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingAssignment ? "Edit Assignment" : "Create Assignment"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter assignment title"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter subject"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Type *
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.college ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select College</option>
                  <option value="Junior College">Junior College</option>
                  <option value="Degree College">Degree College</option>
                </select>
                {errors.college && (
                  <p className="text-red-500 text-xs mt-1">{errors.college}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., FYBScCS, SYJC, TYBMS"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.class ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.class && (
                  <p className="text-red-500 text-xs mt-1">{errors.class}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter class code (e.g., FYBScCS, SYJC, TYBMS)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.deadline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.deadline && (
                  <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment File (PDF) *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required={!editingAssignment}
                    className="sr-only"
                    id="assignment-file"
                    aria-label="Assignment file upload"
                    tabIndex="-1"
                  />
                  <label
                    htmlFor="assignment-file"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`
                      flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${file 
                        ? 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100' 
                        : errors.file
                        ? 'border-red-500 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                      }
                    `}
                    tabIndex="0"
                    role="button"
                    aria-label="Upload assignment PDF file"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('assignment-file').click();
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
                {errors.file && (
                  <p className="text-red-500 text-xs mt-1">{errors.file}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter assignment description (optional)"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
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
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Saving..." : (editingAssignment ? "Update" : "Create")}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ASSIGNMENTS LIST */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading assignments...</div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No assignments created yet</div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-indigo-600 font-medium"
          >
            Create your first assignment
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="text-green-600 font-medium text-sm"
                  >
                    View Submissions ({assignment.stats?.submittedCount || 0})
                  </button>
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="text-indigo-600 font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(assignment._id)}
                    className="text-red-500 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Class:</span> {assignment.class}
                </div>
                <div>
                  <span className="font-medium">College:</span> {assignment.college}
                </div>
                <div>
                  <span className="font-medium">Deadline:</span>{" "}
                  {new Date(assignment.deadline).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">File:</span>{" "}
                  <a
                    href={`${import.meta.env.VITE_API_URL}${assignment.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View PDF
                  </a>
                </div>
              </div>

                {/* SUBMISSION STATISTICS */}
              {assignment.stats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Submission Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{assignment.stats.totalStudents}</div>
                      <div className="text-xs text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{assignment.stats.submittedCount}</div>
                      <div className="text-xs text-gray-600">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{assignment.stats.pendingCount}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{assignment.stats.submissionRate}%</div>
                      <div className="text-xs text-gray-600">Submission Rate</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${assignment.stats.submissionRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {assignment.stats.submissionRate}% of students have submitted
                    </p>
                  </div>
                </div>
              )}

                {assignment.description && (
                <p className="text-gray-700 mt-3 text-sm">
                  {assignment.description}
                </p>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Created: {new Date(assignment.createdAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && selectedAssignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 h-full -translate-y-8"
          onClick={closeSubmissionsModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{selectedAssignment.title}</h2>
                  <p className="text-gray-600">{selectedAssignment.subject} - {selectedAssignment.class}</p>
                </div>
                <button
                  onClick={closeSubmissionsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Statistics Summary */}
              {submissionStats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Overall Statistics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{submissionStats.totalStudents}</div>
                      <div className="text-xs text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{submissionStats.submittedCount}</div>
                      <div className="text-xs text-gray-600">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{submissionStats.pendingCount}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{submissionStats.submissionRate}%</div>
                      <div className="text-xs text-gray-600">Submission Rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submissions List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Submissions</h3>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No submissions yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{submission.studentName}</h4>
                            <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewSubmission(submission)}
                              className="text-indigo-600 hover:underline text-sm"
                            >
                              View PDF
                            </button>
                            <a
                              href={`${import.meta.env.VITE_API_URL}${submission.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline text-sm"
                            >
                              Download
                            </a>
                            <span className={`px-2 py-1 rounded text-xs ${
                              submission.status === 'submitted' ? 'bg-green-100 text-green-800' :
                              submission.status === 'graded' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                        {submission.grade && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Grade: </span>
                            <span className="text-sm">{submission.grade}</span>
                          </div>
                        )}
                        {submission.feedback && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Feedback: </span>
                            <span className="text-sm">{submission.feedback}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* PDF VIEWER MODAL */}
      {showPdfViewer && selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 h-full -translate-y-8"
          onClick={closePdfViewer}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-gray-50 ">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Student Submission</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSubmission.studentName} - {selectedSubmission.studentEmail}
                  </p>
                </div>
                <button
                  onClick={closePdfViewer}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Submitted:</span> {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">File:</span> {selectedSubmission.fileName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {(selectedSubmission.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                <iframe
                  src={`${import.meta.env.VITE_API_URL}${selectedSubmission.fileUrl}`}
                  className="w-full h-full"
                  title={`${selectedSubmission.studentName}'s submission`}
                  frameBorder="0"
                />
              </div>
              
              <div className="mt-4 flex justify-between">
                <a
                  href={`${import.meta.env.VITE_API_URL}${selectedSubmission.fileUrl}`}
                  download={selectedSubmission.fileName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Download PDF
                </a>
                <button
                  onClick={closePdfViewer}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
