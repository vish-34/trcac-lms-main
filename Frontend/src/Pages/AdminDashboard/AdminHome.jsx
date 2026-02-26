import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminHome() {
  const { user, extractNameFromEmail } = useAuth();
  const displayName = user?.email ? extractNameFromEmail(user.email) : 'Admin';

  return(
    <div className="space-y-8">
      {/* HERO SECTION */}
      <motion.div
        initial={{opacity:0 , y:30}}
        animate={{opacity:1 , y:0}}
        className="bg-indigo-100 rounded-2xl p-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your faculty, students and administrative activities.
          </p>
        </div>
        <img
          src="https://illustrations.popsy.co/purple/online-admin.svg"
          className="h-28"
        />
      </motion.div>

      {/* MAIN STATS */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="Total Faculty"
          value="24"
          color="bg-indigo-100"
        />
        <StatCard
          title="Total Students"
          value="482"
          color="bg-purple-100"
        />
        <StatCard
          title="Avg Attendance"
          value="86%"
          color="bg-yellow-100"
        />
        <StatCard
          title="Lectures Conducted"
          value="320"
          color="bg-green-100"
        />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard
          title="Lectures Updated"
          value="18 Today"
          color="bg-blue-100"
        />
        <StatCard
          title="Assignments Submitted"
          value="210"
          color="bg-pink-100"
        />
        <StatCard
          title="Pending Reviews"
          value="42"
          color="bg-red-100"
        />
      </div>

      {/* COURSE OVERVIEW (Recommended) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Course Overview
        </h2>
        <div className="grid grid-cols-3 gap-5">
          <CourseCard
            course="FYBSc CS"
            students="160 Students"
            faculty="6 Faculty"
          />
          <CourseCard
            course="SYBSc CS"
            students="150 Students"
            faculty="7 Faculty"
          />
          <CourseCard
            course="TYBSc CS"
            students="172 Students"
            faculty="8 Faculty"
          />
        </div>
      </div>

      {/* ADMIN ALERTS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Department Alerts
        </h2>
        <div className="bg-white shadow rounded-xl p-6 space-y-3">
          <AlertCard
            text="⚠ Attendance below 75% in SYBSc CS"
          />
          <AlertCard
            text="📄 15 Assignments pending review"
          />
          <AlertCard
            text="📅 DBMS Mid Term scheduled Friday"
          />
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <ActivityCard
            text="Prof. Sharma uploaded Computer Networks Lecture"
            time="10 mins ago"
          />
          <ActivityCard
            text="45 students submitted DBMS Assignment"
            time="1 hour ago"
          />
          <ActivityCard
            text="Attendance marked for FYBSc CS"
            time="Today"
          />
          <ActivityCard
            text="New lecture updated in Java Programming"
            time="Yesterday"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- STAT CARD ---------- */
function StatCard({title,value,color}){
  return(
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

/* ---------- COURSE CARD ---------- */
function CourseCard({course,students,faculty}){
  return(
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="font-semibold text-lg">
        {course}
      </h3>
      <p className="text-gray-500 mt-2">
        {students}
      </p>
      <p className="text-gray-500">
        {faculty}
      </p>
    </div>
  );
}

/* ---------- ALERT ---------- */
function AlertCard({text}){
  return(
    <div className="bg-gray-50 rounded-lg p-4">
      {text}
    </div>
  );
}

/* ---------- ACTIVITY ---------- */
function ActivityCard({text,time}){
  return(
    <div className="flex justify-between border-b pb-2">
      <p className="font-medium">
        {text}
      </p>
      <span className="text-sm text-gray-400">
        {time}
      </span>
    </div>
  );
}
