import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import RecentStudentActivity from "../../components/Teacherdashboard/RecentStudentActivity.jsx";
import PendingAssignmentReviews from "../../components/Teacherdashboard/PendingAssignmentReviews.jsx";
import UpcomingTests from "../../components/Teacherdashboard/UpcomingTests.jsx";

export default function TeacherHome() {
  const { user, extractNameFromEmail } = useAuth();
  const displayName = user?.fullName
    ? user.fullName
    : user?.email
      ? extractNameFromEmail(user.email)
      : 'Teacher';

  return (
    <div className="space-y-8">
      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-100 rounded-2xl p-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your students, lectures and academic activities.
          </p>
        </div>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
          className="h-28 rounded-full"
        />
      </motion.div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value="128"
          color="bg-indigo-100"
        />
        <StatCard
          title="Courses Assigned"
          value="4"
          color="bg-purple-100"
        />
        <StatCard
          title="Lectures Completed"
          value="36"
          color="bg-yellow-100"
        />
        <StatCard
          title="Attendance Avg"
          value="87%"
          color="bg-green-100"
        />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-2 gap-6">
        {/* PENDING ASSIGNMENT REVIEWS */}
        <PendingAssignmentReviews />

        {/* UPCOMING TESTS */}
        <UpcomingTests />
      </div>

      {/* RECENT STUDENT ACTIVITY */}
      <RecentStudentActivity />
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */
function StatCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-xl p-5`}>
      <p className="text-sm text-gray-600">
        {title}
      </p>
      <h2 className="text-xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}

/* ---------------- ACTIVITY CARD ---------------- */
function ActivityCard({ title, desc }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <div>
        <p className="font-medium">
          {title}
        </p>
        <p className="text-sm text-gray-500">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ---------------- TEST CARD ---------------- */
function TestCard({ subject, date }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <div>
        <p className="font-medium">
          {subject}
        </p>
        <p className="text-sm text-gray-500">
          {date}
        </p>
      </div>
    </div>
  );
}
