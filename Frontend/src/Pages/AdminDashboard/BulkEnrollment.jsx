import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Users, FileSpreadsheet } from 'lucide-react';

const BulkEnrollment = () => {
  const [userType, setUserType] = useState('student');
  const [collegeType, setCollegeType] = useState('degree'); // 'degree' or 'junior'
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const isCsvFile = (file) => {
    if (!file) return false;

    const fileName = file.name?.toLowerCase() || '';
    return fileName.endsWith('.csv') || file.type === 'text/csv' || file.type === 'text/plain';
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (isCsvFile(file)) {
      setCsvFile(file);
      setErrors([]);
    } else {
      setErrors(['Please upload a CSV file']);
      setCsvFile(null);
    }
  };

  // Handle drag and drop
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
      if (isCsvFile(file)) {
        setCsvFile(file);
        setErrors([]);
      } else {
        setErrors(['Please upload a CSV file']);
        setCsvFile(null);
      }
    }
  };

  // Submit bulk enrollment
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

      console.log('=== FRONTEND BULK ENROLLMENT ===');
      console.log('User type:', userType);
      console.log('College type:', collegeType);
      console.log('CSV file:', csvFile);
      console.log('File name:', csvFile.name);
      console.log('File size:', csvFile.size);
      console.log('File type:', csvFile.type);

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('userType', userType);
      formData.append('collegeType', collegeType);

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      console.log('Sending request to:', `${import.meta.env.VITE_API_URL}/api/bulk-enrollment/bulk-enroll`);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bulk-enrollment/bulk-enroll`,
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
      console.error('Frontend bulk enrollment error:', error);
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
      console.log('=== DOWNLOADING TEMPLATE ===');
      console.log('User type:', userType);
      console.log('College type:', collegeType);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/bulk-enrollment/templates`
      );
      
      console.log('Template response:', response.data);
      
      const template = response.data;
      const csvContent = userType === 'student' 
        ? collegeType === 'degree'
          ? `fullName,email,rollNo,degree,year,collegeType\n${template.studentTemplate.fullName},${template.studentTemplate.email},${template.studentTemplate.rollNo},${template.studentTemplate.degree},${template.studentTemplate.year},${collegeType}`
          : `fullName,email,rollNo,stream,year,collegeType\n${template.studentTemplate.fullName},${template.studentTemplate.email},${template.studentTemplate.rollNo},${template.studentTemplate.stream || 'Commerce'},${template.studentTemplate.year},${collegeType}`
        : `fullName,email,subjects,employeeId,collegeType\n${template.teacherTemplate.fullName},${template.teacherTemplate.email},${template.teacherTemplate.subjects},${template.teacherTemplate.employeeId},${collegeType}`;

      console.log('Generated CSV content:', csvContent);

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userType}-template.csv`;
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
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bulk User Enrollment
            </h1>
            <p className="text-gray-600">
              Upload a CSV file to create multiple users at once
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              User Type
            </label>
            <div className="flex bg-gray-100 rounded-full p-1 w-fit mx-auto">
              {["student", "teacher"].map((type) => (
                <button
                  key={type}
                  onClick={() => setUserType(type)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    userType === type
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* College Type Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              College Type
            </label>
            <div className="flex bg-gray-100 rounded-full p-1 w-fit mx-auto">
              {["degree", "junior"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCollegeType(type)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    collegeType === type
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} College
                </button>
              ))}
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
              className={`relative border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
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
                    {userType === 'student' 
                      ? collegeType === 'degree'
                        ? `Required columns: fullName, email, rollNo, degree, year, collegeType (${collegeType})`
                        : `Required columns: fullName, email, rollNo, stream, year, collegeType (${collegeType})`
                      : `Required columns: fullName, email, subjects, employeeId, collegeType (${collegeType})`
                    }
                  </p>
                  <p>
                    Download the template above to see the exact format required.
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
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                loading || !csvFile
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
                  <span>Enroll Users</span>
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
                    Users Enrolled
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

              {result.users && result.users.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Enrolled Users & Passwords
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          {userType === 'student' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Roll No
                            </th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Password
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.users.map((user, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            {userType === 'student' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.rollNo || '-'}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="font-mono bg-yellow-100 px-3 py-1 rounded-md border border-yellow-300">
                                {user.password}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                user.role === 'student' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default BulkEnrollment;
