import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Home() {
  const { user, extractNameFromEmail } = useAuth();
  const displayName = user?.email
    ? extractNameFromEmail(user.email)
    : "Student";

  return (
    <div className="space-y-8 px-2 sm:px-0">

      {/* GREETING HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="
        bg-indigo-100
        rounded-2xl
        p-6 sm:p-8
        flex flex-col sm:flex-row
        gap-6
        justify-between
        items-center
        text-center sm:text-left
        "
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Welcome back, {displayName} 👋
          </h1>

          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage your courses, assignments and academic activities.
          </p>
        </div>

        <img
          src="https://illustrations.popsy.co/purple/student-studying.svg"
          className="h-24 sm:h-28 w-auto"
          alt="student illustration"
        />
      </motion.div>


      {/* STATS */}
      <div
        className="
        grid
        grid-cols-2
        sm:grid-cols-2
        md:grid-cols-4
        gap-4 sm:gap-5
        "
      >
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
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Continue Learning
        </h2>

        <div
          className="
          bg-white
          rounded-xl
          shadow
          p-5 sm:p-6
          flex flex-col sm:flex-row
          gap-4
          sm:justify-between
          sm:items-center
          "
        >
          <div>
            <h3 className="font-medium">
              Computer Networks — Lecture 6
            </h3>

            <p className="text-sm text-gray-500">
              IP Addressing
            </p>
          </div>

          <button
            className="
            bg-indigo-600
            text-white
            px-5
            py-2
            rounded-lg
            w-full sm:w-auto
            "
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}


function StatCard({ title, value, color }) {
  return (
    <div
      className={`${color} rounded-xl p-4 sm:p-5`}
    >
      <p className="text-sm text-gray-600">
        {title}
      </p>

      <h2 className="text-lg sm:text-xl font-semibold mt-2">
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