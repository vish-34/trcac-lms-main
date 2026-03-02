import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const AllActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [filters, setFilters] = useState({
    activityType: 'all',
    college: 'all',
    class: 'all',
    timeframe: 'all'
  });

  const activitiesPerPage = 50;

  useEffect(() => {
    fetchAllActivities();
  }, [user, currentPage, filters]);

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: activitiesPerPage
      };

      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all') {
          params[key] = filters[key];
        }
      });

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/activity/all/${user?.id}`,
        { params }
      );

      setActivities(res.data.activities || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalActivities(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching all activities:', err);
      setError('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'lecture_viewed':
        return <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
      case 'assignment_submitted':
        return <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'assignment_downloaded':
        return <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case 'login':
        return <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
      default:
        return <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'lecture_viewed':
        return `Watched lecture: ${activity.details?.lectureTitle || 'Unknown'}`;
      case 'assignment_submitted':
        return `Submitted assignment: ${activity.details?.assignmentTitle || 'Unknown'}`;
      case 'assignment_downloaded':
        return `Downloaded assignment: ${activity.details?.assignmentTitle || 'Unknown'}`;
      case 'login':
        return 'Logged into the system';
      default:
        return 'Performed an activity';
    }
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case 'lecture_viewed': return 'Lecture';
      case 'assignment_submitted': return 'Assignment';
      case 'assignment_downloaded': return 'Download';
      case 'login': return 'Login';
      default: return 'Activity';
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Student Activity</h1>
          <div className="text-sm text-gray-600">
            Showing {activities.length} of {totalActivities} activities
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <select
                value={filters.activityType}
                onChange={(e) => handleFilterChange('activityType', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Activities</option>
                <option value="lecture_viewed">Lectures</option>
                <option value="assignment_submitted">Assignments</option>
                <option value="assignment_downloaded">Downloads</option>
                <option value="login">Logins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
              <select
                value={filters.college}
                onChange={(e) => handleFilterChange('college', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Colleges</option>
                <option value="Degree College">Degree College</option>
                <option value="Junior College">Junior College</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Classes</option>
                <option value="FYJC">FYJC</option>
                <option value="SYJC">SYJC</option>
                <option value="FYBScCS">FYBScCS</option>
                <option value="SYBScCS">SYBScCS</option>
                <option value="TYBScCS">TYBScCS</option>
                <option value="FYBMS">FYBMS</option>
                <option value="SYBMS">SYBMS</option>
                <option value="TYBMS">TYBMS</option>
                <option value="FYBCom">FYBCom</option>
                <option value="SYBCom">SYBCom</option>
                <option value="TYBCom">TYBCom</option>
                <option value="FYBAF">FYBAF</option>
                <option value="SYBAF">SYBAF</option>
                <option value="TYBAF">TYBAF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={filters.timeframe}
                onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow-sm">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2v0a2 2 0 00-2 2h2a2 2 0 002-2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-indigo-600">
                            {activity.studentName?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{activity.studentName}</div>
                          <div className="text-xs text-gray-500">{activity.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getActivityIcon(activity.type)}
                        <span className="ml-2 text-sm text-gray-700">{getActivityDescription(activity)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getActivityTypeLabel(activity.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{activity.college}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{activity.class}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(activity.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === pageNumber
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/teacherdashboard')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AllActivity;
