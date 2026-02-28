import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, extractNameFromEmail } = useAuth();
  const navigate = useNavigate();

  const [continueLecture, setContinueLecture] = useState(null);
  const [continueProgress, setContinueProgress] = useState(null);
  const [attendance, setAttendance] = useState(0);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const displayName = user?.fullName
    ? user.fullName
    : user?.email
      ? extractNameFromEmail(user.email)
      : "Student";

  // Helper function to format attendance percentage
  const formatAttendance = (value) => {
    const rounded = Math.round(value);
    return `${rounded}%`;
  };

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const studentId = user?.id;
        if (!studentId) {
          console.log('No student ID found');
          return;
        }

        console.log('Fetching attendance for student:', studentId);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/activity/attendance/${studentId}`,
        );

        console.log('Attendance response:', res.data);
        const attendanceValue = res.data?.attendance || 0;
        const roundedAttendance = Math.round(attendanceValue);
        setAttendance(roundedAttendance);
        
        // Log additional details for debugging
        console.log('Attendance details:', {
          attendance: roundedAttendance,
          totalLectures: res.data?.totalLectures,
          watchedLectures: res.data?.watchedLectures,
          averageWatchPercentage: res.data?.averageWatchPercentage,
          message: res.data?.message
        });
      } catch (err) {
        console.error('Error fetching attendance:', err);
        console.error('Error response:', err.response?.data);
        setAttendance(0);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);

  useEffect(() => {
    const fetchContinue = async () => {
      try {
        const studentId = user?.id;
        if (!studentId) return;

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/progress/continue/${studentId}`,
        );

        setContinueLecture(res.data?.lecture || null);
        setContinueProgress(res.data?.progress || null);
      } catch (err) {
        console.log(err);
      }
    };

    fetchContinue();
  }, [user]);

  const continuePercent = useMemo(() => {
    const current = Number(continueProgress?.currentTime || 0);
    const duration = Number(continueProgress?.duration || 0);
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((current / duration) * 100)));
  }, [continueProgress]);

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
          src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
          className="h-24 rounded-full sm:h-28 w-auto"
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
          value={attendanceLoading ? "Loading..." : formatAttendance(attendance)}
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

        {continueLecture && continueProgress ? (
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
            <div className="w-full">
              <h3 className="font-medium">
                {continueLecture.title}
              </h3>

              <p className="text-sm text-gray-500">
                {continueLecture.subject}
              </p>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{continuePercent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${continuePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/studentdashboard/lectures?resume=${continueLecture._id}`)}
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
        ) : (
          <div className="bg-white rounded-xl shadow p-5 sm:p-6 text-sm text-gray-500">
            Start watching a lecture to see it here.
          </div>
        )}
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