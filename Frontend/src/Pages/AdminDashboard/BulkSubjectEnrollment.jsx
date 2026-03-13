import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, AlertCircle, BookOpen, FileSpreadsheet } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const BulkSubjectEnrollment = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState('FY');
  const [semester, setSemester] = useState('1');
  const [department, setDepartment] = useState('B.Sc (CS)');
  const [collegeType, setCollegeType] = useState('degree');
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Options for dropdowns
  const yearOptions = ['FY', 'SY', 'TY'];
  const semesterOptions = ['1', '2'];
  const degreeDepartmentOptions = [
    'B.Sc (CS)', 'B.Sc (IT)', 'BMS', 'BCom', 'BAF', 'BA', 'BAMMC'
  ];
  const juniorDepartmentOptions = [
    'Commerce', 'Arts'
  ]
  const [error, SetError] = useState(null);

  const handleSubmit = () => {
    if (collegeType === 'junior' && !juniorDepartmentOptions.includes(department)) {
      toast.error(`Invalid department for junior college: ${department}`);
      return;
    }
    
    if (collegeType === 'degree' && degreeDepartmentOptions.includes(department)) {
      toast.error(`Invalid department for degree college: ${department}`);
      return;
    }
  }

  const RedirectToAdminDashboard = () => {
    navigate('/admindashboard');
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check both extension AND MIME type
      const isCSV = file.name.toLowerCase().endsWith('.csv') ||
        file.type === 'text/csv' ||
        file.type === 'application/vnd.ms-excel';

      const isExcel = file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isCSV && !isExcel) {
        setErrors(['Please upload a CSV (.csv) or Excel (.xlsx, .xls) file']);
        setCsvFile(null);
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors(['File size too large. Maximum size is 10MB']);
        setCsvFile(null);
        return;
      }

      setCsvFile(file);
      setErrors([]);
    } else {
      setErrors(['Please select a CSV or Excel file']);
      setCsvFile(null);
    }
  };

  // Handle drag and 
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Check both extension AND MIME type
      const isCSV = file.name.toLowerCase().endsWith('.csv') ||
        file.type === 'text/csv' ||
        file.type === 'application/vnd.ms-excel';

      const isExcel = file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isCSV && !isExcel) {
        setErrors(['Please upload a CSV (.csv) or Excel (.xlsx, .xls) file']);
        setCsvFile(null);
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors(['File size too large. Maximum size is 10MB']);
        setCsvFile(null);
        return;
      }

      setCsvFile(file);
      setErrors([]);
    } else {
      setErrors(['Please select a CSV or Excel file']);
      setCsvFile(null);
    }
  };

  // Submit bulk subject enrollment
  const handleBulkEnroll = async () => {
    setLoading(true);
    setErrors([]);
    setResult(null);

    try {
      if (!csvFile) {
        setErrors(['Please select a CSV file']);
        setLoading(false);
        return;
      }

      console.log('=== FRONTEND BULK SUBJECT ENROLLMENT ===');
      console.log('Year:', year);
      console.log('Semester:', semester);
      console.log('Department:', department);
      console.log('College Type:', collegeType);
      console.log('CSV file:', csvFile);

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('year', year);
      formData.append('semester', semester);
      formData.append('department', department);
      formData.append('collegeType', collegeType);

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      console.log('Sending request to:', `${import.meta.env.VITE_API_URL}/api/bulk-subjects/bulk-enroll`);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bulk-subjects/bulk-enroll`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Response received:', response.data);
      setResult(response.data);

      if (response.data.errors.length > 0) {
        console.log('Errors from backend:', response.data.errorDetails);
        setErrors(response.data.errorDetails);
      } else {
        setErrors([]);
        // Reset form on success
        setCsvFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (error) {
      console.error('Frontend bulk subject enrollment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);

      let errorMessage = 'Server error: ' + error.message;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      console.log('=== DOWNLOADING SUBJECT TEMPLATE ===');
      console.log('College type:', collegeType);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/bulk-subjects/templates`
      );

      console.log('Template response:', response.data);

      const template = response.data;
      let csvContent = '';

      if (collegeType === 'degree') {
        // Degree college template with multiple verticals
        csvContent = `subjectName,subjectCode,vertical,courseCredits\n` +
          `Mathematics I,MAT101,1,4\n` +
          `Mathematics II,MAT102,2,4\n` +
          `Physics I,PHY101,1,4\n` +
          `Physics II,PHY102,2,4\n` +
          `Chemistry I,CHE101,1,4\n` +
          `Chemistry II,CHE102,2,4\n` +
          `Computer Fundamentals,CS101,1,3\n` +
          `Digital Logic,CS102,2,3\n` +
          `Communication Skills,CS103,3,2`;
      } else {
        // Junior college template (no verticals)
        csvContent = `subjectName,subjectCode,courseCredits\n` +
          `Organisation of Commerce,COM101,4\n` +
          `Book-keeping and Accountancy,COM102,4\n` +
          `Economics,COM103,4\n` +
          `Secretarial Practice,COM104,4\n` +
          `Financial Accounting,COM105,4`;
      }

      console.log('Generated CSV content:', csvContent);

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collegeType}-subjects-template.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      console.error('Error response:', error.response?.data);
      setErrors(['Error downloading template']);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[14px] text-blue-500 mb-2 cursor-pointer hover:text-blue-900 transition-colors flex justify-left" onClick={RedirectToAdminDashboard}>
              ← Back to Admin Dashboard
            </h1>
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bulk Subject Enrollment
            </h1>
            <p className="text-gray-600">
              Upload a CSV file to create multiple subjects at once
            </p>
          </div>

          {/* Subject Configuration */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Subject Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {collegeType === "degree" ? degreeDepartmentOptions.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  )) : null} :
                  {collegeType === "degree" ? null : juniorDepartmentOptions.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              {/* College Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College Type
                </label>
                <div className="flex bg-gray-100 rounded-full p-1">
                  {["degree", "junior"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCollegeType(type)}
                      className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${collegeType === type
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CSV Upload Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Upload CSV File
              </h3>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            {/* Enhanced Upload Area */}
            <div
              className={`relative border-3 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : csvFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />

              <label
                htmlFor="csv-upload"
                className="cursor-pointer"
              >
                <div className="flex flex-col items-center space-y-4">
                  {csvFile ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-700">
                          File Selected
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {csvFile.name}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          {(csvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCsvFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          Drop your CSV file here
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span>CSV files only • Max 10MB</span>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* File Format Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">CSV Format Requirements:</p>
                  <p className="mb-2">
                    {collegeType === 'degree'
                      ? 'Required columns: subjectName, subjectCode, vertical (1-6), courseCredits (1-10)'
                      : 'Required columns: subjectName, subjectCode, courseCredits (1-10)'
                    }
                  </p>
                  <div className="bg-white rounded p-3 border border-blue-200">
                    <p className="font-semibold text-xs mb-2">Example Columns Format:</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {collegeType === 'degree'
                        ? `subjectName,subjectCode,vertical,courseCredit`
                        : `subjectName,subjectCode,courseCredits`
                      }
                    </pre>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Download the template above to get the exact format.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleBulkEnroll}
              disabled={loading || !csvFile}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${loading || !csvFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Enroll Subjects</span>
                </div>
              )}
            </button>
          </div>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-green-800">
                  Enrollment Results
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {result.enrolled}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Subjects Enrolled
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-600">
                    {result.errors}
                  </div>
                  <div className="text-sm text-red-600 font-medium">
                    Errors
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {result.enrolled + result.errors}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Total Processed
                  </div>
                </div>
              </div>

              {result.subjects && result.subjects.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Enrolled Subjects
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <span className="font-medium text-gray-900">{subject.subjectName}</span>
                          <div className="text-sm text-gray-500">
                            {subject.year} - Sem {subject.semester} - {subject.courseOrStream}
                            {subject.vertical && ` - Vertical ${subject.vertical}`}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Enrolled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Errors Section */}
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-red-800">
                  Errors ({errors.length})
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-sm text-red-700">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BulkSubjectEnrollment;
