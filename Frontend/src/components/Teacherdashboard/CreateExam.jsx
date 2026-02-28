import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';

const CreateExam = ({ onExamCreated, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    examDate: '',
    duration: '',
    totalMarks: '',
    class: '',
    college: '',
    instructions: '',
    examType: 'midterm'
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [classError, setClassError] = useState('');

  const classOptions = {
    "Junior College": ["FYJC", "SYJC"],
    "Degree College": [
      "FYBScCS", "SYBScCS", "TYBScCS",
      "FYBMS", "SYBMS", "TYBMS",
      "FYBCom", "SYBCom", "TYBCom",
      "FYBAF", "SYBAF", "TYBAF"
    ]
  };

  const examTypes = ['midterm', 'final', 'quiz', 'practical', 'assignment'];

  const validateClass = (className) => {
    const validClasses = [
      "FYJC", "SYJC",
      "FYBScCS", "SYBScCS", "TYBScCS",
      "FYBMS", "SYBMS", "TYBMS",
      "FYBCom", "SYBCom", "TYBCom",
      "FYBAF", "SYBAF", "TYBAF"
    ];
    
    if (!className.trim()) {
      setClassError('Class is required');
      return false;
    }
    
    if (!validClasses.includes(className.trim())) {
      setClassError('Invalid class. Use format like: FYBScCS, SYJC, TYBMS, etc.');
      return false;
    }
    
    setClassError('');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate class field
    if (name === 'class') {
      validateClass(value);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      examDate: '',
      duration: '',
      totalMarks: '',
      class: '',
      college: '',
      instructions: '',
      examType: 'midterm'
    });
    setFile(null);
    setError('');
    setClassError('');
    if (document.getElementById('exam-file-input')) {
      document.getElementById('exam-file-input').value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate class field
    if (!validateClass(formData.class)) {
      return;
    }
    
    try {
      setUploading(true);
      
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("subject", formData.subject.trim());
      data.append("teacherId", user?.id);
      data.append("teacherName", user?.fullName || user?.email);
      data.append("examDate", formData.examDate);
      data.append("duration", formData.duration);
      data.append("totalMarks", formData.totalMarks);
      data.append("class", formData.class.trim());
      data.append("college", formData.college);
      data.append("instructions", formData.instructions.trim());
      data.append("examType", formData.examType);
      
      if (file) {
        data.append("examFile", file);
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/exams/create`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      handleReset();
      alert('Exam created successfully!');
      onExamCreated && onExamCreated();
      
    } catch (err) {
      console.error('Error creating exam:', err);
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Exam</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date & Time *</label>
            <input
              type="datetime-local"
              name="examDate"
              value={formData.examDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
            <input
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
            <select
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select College</option>
              <option value="Junior College">Junior College</option>
              <option value="Degree College">Degree College</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <input
              type="text"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              placeholder="e.g. FYBScCS, SYJC, TYBMS, FYBAF..."
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                classError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              required
            />
            {classError && (
              <p className="mt-1 text-sm text-red-600">{classError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Valid formats: FYJC, SYJC, FYBScCS, SYBScCS, TYBScCS, FYBMS, SYBMS, TYBMS, FYBCom, SYBCom, TYBCom, FYBAF, SYBAF, TYBAF
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
          <select
            name="examType"
            value={formData.examType}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {examTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Paper (Optional)</label>
          <div className="relative">
            <input
              type="file"
              id="exam-file-input"
              onChange={handleFileChange}
              accept=".pdf,image/*"
              className="hidden"
            />
            <label
              htmlFor="exam-file-input"
              className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                file 
                  ? 'border-indigo-400 bg-indigo-50 hover:bg-indigo-100' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-center">
                {file ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-indigo-700">{file.name}</p>
                      <p className="text-xs text-indigo-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        document.getElementById('exam-file-input').value = '';
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;
