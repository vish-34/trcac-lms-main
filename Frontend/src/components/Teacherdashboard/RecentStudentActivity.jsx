import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const RecentStudentActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecentActivity();
    fetchActivityStats();
  }, [user, timeframe, filter]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const params = { limit: 20 };

      if (filter !== 'all') {
        params.activityType = filter;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/activity/recent/${user?.id}`,
        { params }
      );

      setActivities(res.data.activities || []);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError('Failed to fetch recent activity');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/activity/stats/${user?.id}`,
        { params: { timeframe } }
      );

      setStats(res.data);
    } catch (err) {
      console.error('Error fetching activity stats:', err);
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
        return `Watched lecture: ${activity.details.lectureTitle || 'Unknown'}`;
      case 'assignment_submitted':
        return `Submitted assignment: ${activity.details.assignmentTitle || 'Unknown'}`;
      case 'assignment_downloaded':
        return `Downloaded assignment: ${activity.details.assignmentTitle || 'Unknown'}`;
      case 'login':
        return 'Logged into the system';
      default:
        return 'Performed an activity';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Recent Student Activity
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="all">All Activities</option>
            <option value="lecture_viewed">Lectures</option>
            <option value="assignment_submitted">Assignments</option>
            <option value="login">Logins</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">{stats.totalStats?.totalActivities || 0}</div>
            <div className="text-xs text-blue-600">Total Activities</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">{stats.totalStats?.uniqueStudentCount || 0}</div>
            <div className="text-xs text-green-600">Active Students</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">{stats.totalStats?.avgActivitiesPerStudent || 0}</div>
            <div className="text-xs text-purple-600">Avg / Student</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-600">{activities.length}</div>
            <div className="text-xs text-yellow-600">Recent Activities</div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((studentActivity) => (
          <div key={studentActivity.student.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-200">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {studentActivity.student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                    {studentActivity.student.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 break-all">
                    {studentActivity.student.email}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500">
                {formatTimeAgo(studentActivity.lastActivity)}
              </div>
            </div>

            <div className="space-y-2">
              {studentActivity.activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">

                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <span className="text-gray-700 break-words">
                      {getActivityDescription(activity)}
                    </span>
                  </div>

                  <div className="sm:ml-auto text-xs bg-gray-200 px-2 py-1 rounded w-fit">
                    {getActivityTypeLabel(activity.type)}
                  </div>

                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

      {activities.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/teacherdashboard/activity')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All Activity →
          </button>
        </div>
      )}

    </div>
  );
};

export default RecentStudentActivity;