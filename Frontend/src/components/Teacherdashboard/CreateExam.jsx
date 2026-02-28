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
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'class') {
      validateClass(value);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
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
    const input = document.getElementById('exam-file-input');
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateClass(formData.class)) return;

    try {
      setUploading(true);

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value?.trim ? value.trim() : value)
      );

      data.append("teacherId", user?.id);
      data.append("teacherName", user?.fullName || user?.email);

      if (file) data.append("examFile", file);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/exams/create`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      handleReset();
      onExamCreated && onExamCreated();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 max-w-6xl mx-auto">

      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
        Create New Exam
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Exam Title *" name="title" value={formData.title} onChange={handleInputChange} />
          <InputField label="Subject *" name="subject" value={formData.subject} onChange={handleInputChange} />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Exam Date & Time *" type="datetime-local" name="examDate" value={formData.examDate} onChange={handleInputChange} />
          <InputField label="Duration (minutes) *" type="number" name="duration" value={formData.duration} onChange={handleInputChange} />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <InputField label="Total Marks *" type="number" name="totalMarks" value={formData.totalMarks} onChange={handleInputChange} />

          <SelectField label="College *" name="college" value={formData.college} onChange={handleInputChange}>
            <option value="">Select College</option>
            <option value="Junior College">Junior College</option>
            <option value="Degree College">Degree College</option>
          </SelectField>

          <div>
            <label className="block text-sm font-medium mb-1">Class *</label>
            <input
              type="text"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 ${
                classError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {classError && (
              <p className="text-sm text-red-600 mt-1">{classError}</p>
            )}
          </div>
        </div>

        {/* Exam Type */}
        <SelectField label="Exam Type *" name="examType" value={formData.examType} onChange={handleInputChange}>
          {examTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </SelectField>

        {/* Textareas */}
        <TextareaField label="Description" name="description" value={formData.description} onChange={handleInputChange} />
        <TextareaField label="Instructions" name="instructions" value={formData.instructions} onChange={handleInputChange} />

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Exam Paper (Optional)</label>

          <input
            type="file"
            id="exam-file-input"
            onChange={handleFileChange}
            accept=".pdf,image/*"
            className="hidden"
          />

          <label
            htmlFor="exam-file-input"
            className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50"
          >
            {file ? (
              <p className="text-sm text-indigo-600">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to upload PDF or image (Max 10MB)</p>
            )}
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">

          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            {uploading ? 'Creating...' : 'Create Exam'}
          </button>

        </div>

      </form>
    </div>
  );
};

export default CreateExam;


/* --- Small Reusable UI Components --- */

function InputField({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        required
      />
    </div>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        required
      >
        {children}
      </select>
    </div>
  );
}

function TextareaField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea
        rows={3}
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
    </div>
  );
}