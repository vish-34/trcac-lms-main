import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Home() {
  const { user, extractNameFromEmail } = useAuth();
  const displayName = user?.email ? extractNameFromEmail(user.email) : 'Student';

  return (
    <div className="space-y-8">
      {/* GREETING HERO */}
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
            Manage your courses, assignments and academic activities.
          </p>
        </div>
        <img
          src="https://illustrations.popsy.co/purple/student-studying.svg"
          className="h-28"
        />
      </motion.div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="Attendance"
          value="87%"
          color="bg-yellow-100"
        />
        <StatCard
          title="Lectures Completed"
          value="24"
          color="bg-indigo-100"
        />
        <StatCard
          title="Assignments"
          value="3 Pending"
          color="bg-pink-100"
        />
        <StatCard
          title="Subjects"
          value="6 Active"
          color="bg-purple-100"
        />
      </div>

      {/* CONTINUE LEARNING */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Continue Learning
        </h2>
        <div className="bg-white rounded-xl shadow p-6 flex justify-between">
          <div>
            <h3 className="font-medium">
              Computer Networks — Lecture 6
            </h3>
            <p className="text-sm text-gray-500">
              IP Addressing
            </p>
          </div>
          <button className="bg-indigo-600 text-white px-5 rounded-lg">
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

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

function Notice({ text }) {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      {text}
    </div>
  );
}
