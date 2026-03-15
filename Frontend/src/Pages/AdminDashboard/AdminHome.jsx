import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminHome() {
  const { user, extractNameFromEmail } = useAuth();

  const displayName = user?.fullName || (user?.email ? extractNameFromEmail(user.email) : "Admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalFaculty: 0,
      totalStudents: 0,
      avgAttendance: 0,
      lecturesConducted: 0,
      lecturesUpdatedToday: 0,
      assignmentsSubmitted: 0,
      pendingReviews: 0,
    },
    courseOverview: [],
    alerts: [],
    recentActivity: [],
  });

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-summary`);
        setDashboardData(response.data);
      } catch (fetchError) {
        console.error("Error fetching admin dashboard summary:", fetchError);
        setError("Unable to load admin dashboard data right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, []);

  return (
    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="
        bg-indigo-100
        rounded-2xl
        p-5 sm:p-8
        flex
        flex-col
        sm:flex-row
        gap-6
        justify-between
        items-center
        text-center sm:text-left
      "
      >
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold leading-tight">
            Welcome back, {displayName}
          </h1>

          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage your faculty, students and administrative activities.
          </p>
        </div>

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
          className="h-20 rounded-full sm:h-28 w-auto shrink-0"
          alt="admin illustration"
        />
      </motion.div>

      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-4 sm:gap-5
      "
      >
        <StatCard title="Total Faculty" value={dashboardData.stats.totalFaculty} color="bg-indigo-100" loading={loading} />
        <StatCard title="Total Students" value={dashboardData.stats.totalStudents} color="bg-purple-100" loading={loading} />
        <StatCard title="Avg Attendance" value={`${dashboardData.stats.avgAttendance}%`} color="bg-yellow-100" loading={loading} />
        <StatCard title="Lectures Conducted" value={dashboardData.stats.lecturesConducted} color="bg-green-100" loading={loading} />
      </div>

      <div
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        gap-4 sm:gap-5
      "
      >
        <StatCard title="Lectures Updated" value={`${dashboardData.stats.lecturesUpdatedToday} Today`} color="bg-blue-100" loading={loading} />
        <StatCard title="Assignments Submitted" value={dashboardData.stats.assignmentsSubmitted} color="bg-pink-100" loading={loading} />
        <StatCard title="Pending Reviews" value={dashboardData.stats.pendingReviews} color="bg-red-100" loading={loading} />
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Course Overview</h2>

        <div
          className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          gap-4 sm:gap-5
        "
        >
          {loading ? (
            [1, 2, 3].map((item) => <CourseCardSkeleton key={item} />)
          ) : dashboardData.courseOverview.length > 0 ? (
            dashboardData.courseOverview.map((item) => (
              <CourseCard
                key={item.course}
                course={item.course}
                students={`${item.students} Students`}
                faculty={`${item.faculty} Faculty`}
              />
            ))
          ) : (
            <EmptyState text="No course overview data available yet." />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Department Alerts</h2>

        <div className="bg-white shadow rounded-xl p-5 sm:p-6 space-y-3">
          {loading ? (
            [1, 2, 3].map((item) => <RowSkeleton key={item} />)
          ) : dashboardData.alerts.length > 0 ? (
            dashboardData.alerts.map((alert) => <AlertCard key={alert} text={alert} />)
          ) : (
            <EmptyState text="No department alerts right now." />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Activity</h2>

        <div className="bg-white rounded-xl shadow p-5 sm:p-6 space-y-3">
          {loading ? (
            [1, 2, 3, 4].map((item) => <RowSkeleton key={item} />)
          ) : dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((activity, index) => (
              <ActivityCard key={`${activity.text}-${index}`} text={activity.text} time={activity.time} />
            ))
          ) : (
            <EmptyState text="No recent activity yet." />
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}

function StatCard({ title, value, color, loading }) {
  return (
    <div className={`${color} rounded-xl p-4 sm:p-5`}>
      <p className="text-sm text-gray-600">{title}</p>

      {loading ? (
        <div className="h-7 mt-2 rounded bg-white/60 animate-pulse" />
      ) : (
        <h2 className="text-lg sm:text-xl font-semibold mt-2">{value}</h2>
      )}
    </div>
  );
}

function CourseCard({ course, students, faculty }) {
  return (
    <div className="bg-white shadow rounded-xl p-5 sm:p-6">
      <h3 className="font-semibold text-lg">{course}</h3>
      <p className="text-gray-500 mt-2">{students}</p>
      <p className="text-gray-500">{faculty}</p>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-white shadow rounded-xl p-5 sm:p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mt-4" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  );
}

function AlertCard({ text }) {
  return <div className="bg-gray-50 rounded-lg p-4">{text}</div>;
}

function ActivityCard({ text, time }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2 gap-1">
      <p className="font-medium">{text}</p>
      <span className="text-sm text-gray-400">{time}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">{text}</div>;
}

function RowSkeleton() {
  return (
    <div className="animate-pulse border-b pb-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/4 mt-2" />
    </div>
  );
}
