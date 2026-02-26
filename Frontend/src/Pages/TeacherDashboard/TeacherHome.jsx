import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TeacherHome() {
  const { user, extractNameFromEmail } = useAuth();
  const displayName = user?.email ? extractNameFromEmail(user.email) : 'Teacher';

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
          src="https://illustrations.popsy.co/purple/teacher-explaining.svg"
          className="h-28"
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
        {/* PENDING ASSIGNMENTS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Pending Assignment Reviews
          </h2>
          <div className="space-y-3">
            <ActivityCard
              title="DBMS Assignment 3"
              desc="15 submissions pending"
            />
            <ActivityCard
              title="Computer Networks"
              desc="8 submissions pending"
            />
            <ActivityCard
              title="Java Practical"
              desc="12 submissions pending"
            />
          </div>
        </div>

        {/* UPCOMING TESTS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Upcoming Tests
          </h2>
          <div className="space-y-3">
            <TestCard
              subject="Computer Networks"
              date="Friday"
            />
            <TestCard
              subject="Operating Systems"
              date="Monday"
            />
            <TestCard
              subject="DBMS"
              date="Next Week"
            />
          </div>
        </div>
      </div>

      {/* RECENT STUDENT ACTIVITY */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Student Activity
        </h2>
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <ActivityCard
            title="Rahul Sharma submitted DBMS Assignment"
            desc="10 mins ago"
          />
          <ActivityCard
            title="Sneha attended Lecture 5"
            desc="1 hour ago"
          />
          <ActivityCard
            title="Akash completed Quiz"
            desc="Today"
          />
          <ActivityCard
            title="Priya uploaded Practical File"
            desc="Yesterday"
          />
        </div>
      </div>
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
