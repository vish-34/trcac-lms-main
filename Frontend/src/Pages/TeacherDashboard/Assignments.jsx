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

  // Dynamic Subjects List State
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    deadline: "",
    class: "",
    college: "Degree College",
    year: "FY",
    semester: "1",
    course: "B.Sc (CS)"
  });

  // 🔄 Sync Semester with Year (for Degree College)
  useEffect(() => {
    if (formData.college === "Degree College") {
      if (formData.year === "FY") setFormData((prev) => ({ ...prev, semester: "1" }));
      if (formData.year === "SY") setFormData((prev) => ({ ...prev, semester: "3" }));
      if (formData.year === "TY") setFormData((prev) => ({ ...prev, semester: "5" }));
    }
  }, [formData.year, formData.college]);

  // 🔄 Auto-Generate Class Name (e.g., FYBScCS or FYJC)
  useEffect(() => {
    const cleanCourse = formData.course.replace(/[^a-zA-Z]/g, ""); 
    let generatedClass = "";

    if (formData.college === "Junior College") {
      generatedClass = `${formData.year}${cleanCourse}`; // e.g. FYCommerce
    } else {
      generatedClass = `${formData.year}${cleanCourse}`; // e.g. FYBScCS
    }

    setFormData((prev) => ({ ...prev, class: generatedClass }));
  }, [formData.year, formData.course, formData.college]);

  // 🔄 Fetch Subjects dynamically based on filters
  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      if (!formData.college || !showForm) return;
      try {
        setFetchingSubjects(true);
        const params = {
          collegeType: formData.college === "Degree College" ? "degree" : "junior",
          year: formData.year,
          courseOrStream: formData.course,
          ...(formData.college === "Degree College" && { semester: formData.semester })
        };

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`,
          { params }
        );

        if (response.data.success) {
          setAvailableSubjects(response.data.subjects);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setFetchingSubjects(false);
      }
    };

    fetchAvailableSubjects();
  }, [formData.college, formData.year, formData.semester, formData.course, showForm]);

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

    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    if (!file && !editingAssignment) {
      newErrors.file = "Assignment file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({
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
    if (!validateForm()) return;

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("subject", formData.subject.trim());
    data.append("teacherId", user?.id);
    data.append("teacherName", user?.fullName || user?.email);
    data.append("deadline", formData.deadline);
    data.append("class", formData.class.trim());
    data.append("college", formData.college);
    // New dynamic fields for backend
    data.append("year", formData.year);
    data.append("course", formData.course);
    if (formData.college === "Degree College") data.append("semester", formData.semester);

    if (file) data.append("assignmentFile", file);

    try {
      setUploading(true);
      if (editingAssignment) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/assignments/${editingAssignment._id}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/assignments/create`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      resetForm();
      await fetchAssignments();
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to save assignment.");
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
      college: assignment.college,
      year: assignment.year || "FY",
      course: assignment.course || "B.Sc (CS)",
      semester: assignment.semester || "1"
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
      setError("Failed to fetch submissions");
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/assignments/${assignmentId}`);
      await fetchAssignments();
    } catch (err) {
      setError("Failed to delete assignment");
    }
  };

  const handleMarkAsDone = async (assignmentId) => {
    try {
      const grade = prompt('Enter grade (optional):');
      const feedback = prompt('Enter feedback (optional):');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/assignments/${assignmentId}/grade`,
        { grade: grade || null, feedback: feedback || null }
      );
      await fetchAssignments();
    } catch (error) {
      setError('Failed to mark as done');
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
      college: "Degree College",
      year: "FY",
      semester: "1",
      course: "B.Sc (CS)"
    });
    setErrors({});
    setFile(null);
    setEditingAssignment(null);
    setShowForm(false);
    setError("");
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
              {/* Title */}
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
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* College Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Type *
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Degree College">Degree College</option>
                  <option value="Junior College">Junior College</option>
                </select>
              </div>

              {/* Course Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.college === "Junior College" ? "Stream" : "Course"} *
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {formData.college === "Junior College" ? (
                    <>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </>
                  ) : (
                    <>
                      <option value="B.Sc (CS)">B.Sc (CS)</option>
                      <option value="B.Sc (IT)">B.Sc (IT)</option>
                      <option value="BA">BA</option>
                      <option value="BAMMC">BAMMC</option>
                      <option value="BCom">BCom</option>
                      <option value="BMS">BMS</option>
                      <option value="BAF">BAF</option>
                    </>
                  )}
                </select>
              </div>

              {/* Year Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {formData.college === "Junior College" ? (
                    <>
                      <option value="FY">FYJC</option>
                      <option value="SY">SYJC</option>
                    </>
                  ) : (
                    <>
                      <option value="FY">First Year</option>
                      <option value="SY">Second Year</option>
                      <option value="TY">Third Year</option>
                    </>
                  )}
                </select>
              </div>

              {/* Semester Select (Only for Degree) */}
              {formData.college === "Degree College" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {formData.year === "FY" && (
                      <><option value="1">Sem 1</option><option value="2">Sem 2</option></>
                    )}
                    {formData.year === "SY" && (
                      <><option value="3">Sem 3</option><option value="4">Sem 4</option></>
                    )}
                    {formData.year === "TY" && (
                      <><option value="5">Sem 5</option><option value="6">Sem 6</option></>
                    )}
                  </select>
                </div>
              )}

              {/* Subject (Dynamic Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject * {fetchingSubjects && <span className="text-xs text-indigo-500">(Loading...)</span>}
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub._id} value={sub.subjectName}>{sub.subjectName}</option>
                  ))}
                </select>
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>

              {/* Target Class (Read Only Auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Class</label>
                <input
                  type="text"
                  value={formData.class}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-indigo-600 font-medium"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.deadline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>

              {/* File Upload */}
              <div className="md:col-span-2">
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
                  />
                  <label
                    htmlFor="assignment-file"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      file ? 'border-indigo-500 bg-indigo-50' : errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      {file ? (
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Click or drag PDF here (Max 10MB)</p>
                      )}
                    </div>
                  </label>
                </div>
                {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Optional description"
              />
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 border text-gray-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {uploading ? "Saving..." : editingAssignment ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ASSIGNMENTS LIST */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No assignments found.</div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                  <p className="text-gray-600 mt-1">{assignment.subject}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewSubmissions(assignment)} className="text-green-600 font-medium text-sm">
                    View Submissions ({assignment.stats?.submittedCount || 0})
                  </button>
                  <button onClick={() => handleMarkAsDone(assignment._id)} className="text-purple-600 font-medium text-sm">
                    Mark as Done
                  </button>
                  <button onClick={() => handleEdit(assignment)} className="text-indigo-600 font-medium text-sm">Edit</button>
                  <button onClick={() => handleDelete(assignment._id)} className="text-red-500 font-medium text-sm">Delete</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div><span className="font-medium">Class:</span> {assignment.class}</div>
                <div><span className="font-medium">College:</span> {assignment.college}</div>
                <div><span className="font-medium">Deadline:</span> {new Date(assignment.deadline).toLocaleDateString()}</div>
                <div><a href={`${import.meta.env.VITE_API_URL}${assignment.fileUrl}`} target="_blank" className="text-indigo-600 hover:underline">View PDF</a></div>
              </div>

              {assignment.stats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-4 gap-4 text-center">
                  <div><div className="text-xl font-bold text-blue-600">{assignment.stats.totalStudents}</div><div className="text-xs">Total</div></div>
                  <div><div className="text-xl font-bold text-green-600">{assignment.stats.submittedCount}</div><div className="text-xs">Submitted</div></div>
                  <div><div className="text-xl font-bold text-orange-600">{assignment.stats.pendingCount}</div><div className="text-xs">Pending</div></div>
                  <div><div className="text-xl font-bold text-purple-600">{assignment.stats.submissionRate}%</div><div className="text-xs">Rate</div></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedAssignment.title}</h2>
                <p className="text-gray-600">{selectedAssignment.subject} - {selectedAssignment.class}</p>
              </div>
              <button onClick={closeSubmissionsModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {submissions.length === 0 ? <p className="text-center text-gray-500">No submissions yet.</p> : (
                <div className="space-y-3">
                  {submissions.map((sub, i) => (
                    <div key={i} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{sub.studentName}</h4>
                        <p className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleViewSubmission(sub)} className="text-indigo-600 text-sm">View PDF</button>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{sub.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      {showPdfViewer && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">{selectedSubmission.studentName}'s Work</h3>
              <button onClick={closePdfViewer} className="text-gray-500 text-xl font-bold">&times;</button>
            </div>
            <div className="flex-1">
              <iframe
                src={`${import.meta.env.VITE_API_URL}${selectedSubmission.fileUrl}`}
                className="w-full h-full"
                title="Submission Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}