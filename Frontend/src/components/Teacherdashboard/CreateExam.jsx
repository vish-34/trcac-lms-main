import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';

const CreateExam = ({ onExamCreated, onCancel }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '', // This will now be a selection
    examDate: '',
    duration: '',
    totalMarks: '',
    class: '', // This will be auto-generated
    college: 'Degree College',
    year: 'FY',
    semester: '1',
    course: 'B.Sc (CS)',
    instructions: '',
    examType: 'midterm'
  });

  const [subjects, setSubjects] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const examTypes = ['midterm', 'final', 'quiz', 'practical', 'assignment'];

  // 🔄 Sync Semester with Year (for Degree College)
  useEffect(() => {
    if (formData.college === "Degree College") {
      const semMap = { FY: "1", SY: "3", TY: "5" };
      setFormData(prev => ({ ...prev, semester: semMap[prev.year] }));
    }
  }, [formData.year, formData.college]);

  // 🔄 Auto-Generate Class String (e.g., FYBScCS or FYJC)
  useEffect(() => {
    const cleanCourse = formData.course.replace(/[^a-zA-Z]/g, ""); // "B.Sc (CS)" -> "BScCS"
    let generatedClass = "";

    if (formData.college === "Junior College") {
      generatedClass = `${formData.year}JC`; // FYJC
    } else {
      generatedClass = `${formData.year}${cleanCourse}`; // FYBScCS
    }

    setFormData(prev => ({ ...prev, class: generatedClass }));
  }, [formData.year, formData.course, formData.college]);

  // 🔄 Fetch Subjects based on filters
  useEffect(() => {
    const fetchFilteredSubjects = async () => {
      try {
        setLoadingSubjects(true);
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
          setSubjects(response.data.subjects);
          // Auto-select first subject if available
          if (response.data.subjects.length > 0) {
            setFormData(prev => ({ ...prev, subject: response.data.subjects[0].subjectName }));
          } else {
            setFormData(prev => ({ ...prev, subject: "" }));
          }
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchFilteredSubjects();
  }, [formData.college, formData.year, formData.semester, formData.course]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleReset = () => {
    setFormData({
      title: '', description: '', subject: '', examDate: '',
      duration: '', totalMarks: '', class: '', college: 'Degree College',
      year: 'FY', semester: '1', course: 'B.Sc (CS)', instructions: '', examType: 'midterm'
    });
    setFile(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      data.append("teacherId", user?.id);
      data.append("teacherName", user?.fullName || user?.email);
      if (file) data.append("examFile", file);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/exams/create`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      handleReset();
      onExamCreated && onExamCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 max-w-6xl mx-auto border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Exam</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Exam Title *" name="title" value={formData.title} onChange={handleInputChange} />
          <InputField label="Exam Date & Time *" type="datetime-local" name="examDate" value={formData.examDate} onChange={handleInputChange} />
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
          <SelectField label="College *" name="college" value={formData.college} onChange={handleInputChange}>
            <option value="Degree College">Degree College</option>
            <option value="Junior College">Junior College</option>
          </SelectField>

          <SelectField label="Year *" name="year" value={formData.year} onChange={handleInputChange}>
            {formData.college === "Junior College" ? (
              <><option value="FY">FYJC</option><option value="SY">SYJC</option></>
            ) : (
              <><option value="FY">First Year</option><option value="SY">Second Year</option><option value="TY">Third Year</option></>
            )}
          </SelectField>

          <SelectField label="Course/Stream *" name="course" value={formData.course} onChange={handleInputChange}>
            {formData.college === "Junior College" ? (
              <><option value="Commerce">Commerce</option><option value="Arts">Arts</option></>
            ) : (
              <><option value="B.Sc (CS)">B.Sc (CS)</option>
                      <option value="B.Sc (IT)">B.Sc (IT)</option>
                      <option value="BA">BA</option>
                      <option value="BAMMC">BAMMC</option>
                      <option value="BCom">BCom</option>
                      <option value="BMS">BMS</option>
                      <option value="BAF">BAF</option></>
            )}
          </SelectField>

          {/* Dynamic Subject Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              required
            >
              {loadingSubjects ? <option>Loading...</option> :
                subjects.length === 0 ? <option>No Subjects Found</option> :
                  subjects.map(sub => <option key={sub._id} value={sub.subjectName}>{sub.subjectName}</option>)
              }
            </select>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="Duration (mins) *" type="number" name="duration" value={formData.duration} onChange={handleInputChange} />
          <InputField label="Total Marks *" type="number" name="totalMarks" value={formData.totalMarks} onChange={handleInputChange} />
          <div>
            <label className="block text-sm font-medium mb-1">Target Class (Auto)</label>
            <input type="text" value={formData.class} readOnly className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-indigo-600 font-bold" />
          </div>
        </div>

        <SelectField label="Exam Type *" name="examType" value={formData.examType} onChange={handleInputChange}>
          {examTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </SelectField>

        <TextareaField label="Instructions" name="instructions" value={formData.instructions} onChange={handleInputChange} placeholder="e.g. Use of calculator is allowed..." />

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Exam Paper (PDF/Image)</label>
          <input type="file" id="exam-file-input" onChange={handleFileChange} accept=".pdf,image/*" className="hidden" />
          <label htmlFor="exam-file-input" className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 border-gray-300">
            {file ? <p className="text-sm text-indigo-600 font-medium">Selected: {file.name}</p> : <p className="text-sm text-gray-500">Click to upload (Max 10MB)</p>}
          </label>
        </div>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">{error}</div>}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={uploading} className="px-8 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 font-medium shadow-md hover:bg-indigo-700 transition">
            {uploading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;

/* --- UI Components (Remained Same but cleaned up) --- */
function InputField({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <input type={type} {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
    </div>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <select {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required>
        {children}
      </select>
    </div>
  );
}

function TextareaField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <textarea rows={2} {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
    </div>
  );
}