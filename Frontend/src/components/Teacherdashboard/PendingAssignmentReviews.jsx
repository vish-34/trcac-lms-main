import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const PendingAssignmentReviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  console.log('PendingAssignmentReviews component rendering');

  const handleViewSubmission = (assignmentId, submissionId) => {
    // Check if pendingReviews exists and is an array
    if (!pendingReviews || !Array.isArray(pendingReviews)) {
      console.log('pendingReviews is not available:', pendingReviews);
      return;
    }
    
    console.log('Looking for assignmentId:', assignmentId, 'submissionId:', submissionId);
    console.log('Available assignments:', pendingReviews.map(a => ({ id: a.assignmentId, title: a.title })));
    
    // Find the assignment and submission to remove
    const assignmentIndex = pendingReviews.findIndex(a => a.assignmentId === assignmentId);
    console.log('Found assignment index:', assignmentIndex);
    
    if (assignmentIndex !== -1) {
      const updatedAssignment = { ...pendingReviews[assignmentIndex] };
      const submissionIndex = updatedAssignment.pendingSubmissions.findIndex(s => s.studentId === submissionId);
      console.log('Found submission index:', submissionIndex);
      
      if (submissionIndex !== -1) {
        // Remove submission from the list
        updatedAssignment.pendingSubmissions.splice(submissionIndex, 1);
        
        // Update state
        const updatedReviews = [...pendingReviews];
        if (updatedAssignment.pendingSubmissions.length === 0) {
          // Remove entire assignment if no more submissions
          updatedReviews.splice(assignmentIndex, 1);
        } else {
          updatedAssignment[assignmentIndex] = updatedAssignment;
        }
        
        console.log('Updated reviews:', updatedReviews);
        setPendingReviews(updatedReviews);
      }
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, [user]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/exams/pending-reviews/${user?.id}`
      );
      
      setPendingReviews(res.data.pendingReviews || []);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setError('Failed to fetch pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const submittedDate = new Date(dateString);
    const diffMs = now - submittedDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const toggleExpand = (assignmentId) => {
    setExpandedAssignment(expandedAssignment === assignmentId ? null : assignmentId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Pending Assignment Reviews</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {pendingReviews.length} assignment{pendingReviews.length !== 1 ? 's' : ''} pending review
          </span>
        </div>
      </div>

      {/* Content */}
      {pendingReviews.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
          <p className="mt-1 text-sm text-gray-500">No pending assignment reviews at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <div key={review.assignmentId} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Assignment Header */}
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleExpand(review.assignmentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{review.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">{review.subject}</span>
                      <span className="text-sm text-gray-500">{review.class}</span>
                      <span className="text-sm text-gray-500">{review.college}</span>
                      <span className="text-sm text-gray-500">Deadline: {formatDate(review.deadline)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-orange-600">{review.pendingCount}</div>
                      <div className="text-xs text-gray-500">pending</div>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedAssignment === review.assignmentId ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Submissions */}
              {expandedAssignment === review.assignmentId && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <h5 className="font-medium text-gray-900 mb-3">Submitted Assignments ({review.pendingSubmissions.length})</h5>
                  <div className="space-y-3">
                    {review.pendingSubmissions.map((submission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {submission.studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{submission.studentName}</p>
                            <p className="text-sm text-gray-500">{submission.studentEmail}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatTimeAgo(submission.submittedAt)}</p>
                          {submission.fileUrl && (
                            <button
                              onClick={() => {
                                // Open file in new tab
                                window.open(`${import.meta.env.VITE_API_URL}${submission.fileUrl}`, '_blank');
                                // Remove from pending list
                                handleViewSubmission(review.assignmentId, submission.studentId);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                            >
                              View Submission
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => navigate('/teacherdashboard/assignment')}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Review All Submissions
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingAssignmentReviews;
