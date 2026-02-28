import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const UpcomingTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('UpcomingTests component rendering');

  useEffect(() => {
    fetchUpcomingExams();
  }, [user]);

  const fetchUpcomingExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/exams/upcoming/${user?.id}`,
        { params: { limit: 10 } }
      );
      
      setExams(res.data.exams || []);
    } catch (err) {
      console.error('Error fetching upcoming exams:', err);
      setError('Failed to fetch upcoming exams');
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeColor = (examType) => {
    switch (examType) {
      case 'midterm': return 'bg-blue-100 text-blue-800';
      case 'final': return 'bg-red-100 text-red-800';
      case 'quiz': return 'bg-green-100 text-green-800';
      case 'practical': return 'bg-purple-100 text-purple-800';
      case 'assignment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExam = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffTime = exam - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const getUrgencyColor = (days) => {
    if (days === 'Today' || days === 'Tomorrow') return 'text-red-600 font-semibold';
    if (typeof days === 'string' && parseInt(days) <= 3) return 'text-orange-600 font-medium';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Tests</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {exams.length} exam{exams.length !== 1 ? 's' : ''} scheduled
          </span>
        </div>
      </div>

      {/* Content */}
      {exams.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming tests</h3>
          <p className="mt-1 text-sm text-gray-500">Schedule your first exam to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam, index) => {
            const daysUntil = getDaysUntilExam(exam.examDate);
            const urgencyColor = getUrgencyColor(daysUntil);
            
            return (
              <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{exam.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getExamTypeColor(exam.examType)}`}>
                        {exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{exam.subject}</span>
                      <span>•</span>
                      <span>{exam.class}</span>
                      <span>•</span>
                      <span>{exam.college}</span>
                    </div>

                    {exam.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {exam.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{formatDate(exam.examDate)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{formatDuration(exam.duration)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{exam.totalMarks} marks</span>
                      </div>
                    </div>

                    {exam.instructions && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <strong>Instructions:</strong> {exam.instructions}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className={`text-lg ${urgencyColor}`}>
                      {daysUntil}
                    </div>
                    <div className="text-xs text-gray-500">
                      {exam.examDate ? new Date(exam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                    {exam.fileUrl && (
                      <a 
                        href={`${import.meta.env.VITE_API_URL}${exam.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                      >
                        View Paper
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View More */}
      {exams.length > 0 && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/teacherdashboard/exams')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All Exams →
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingTests;
