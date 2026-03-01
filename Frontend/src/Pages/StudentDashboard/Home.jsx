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

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh



  const displayName = user?.fullName

    ? user.fullName

    : user?.email

      ? extractNameFromEmail(user.email)

      : "Student";



  // Function to refresh continue learning data
  const refreshContinueLearning = () => {
    console.log('🔄 Refreshing continue learning data...');
    setRefreshKey(prev => prev + 1);
  };

  // Function to navigate to lectures with resume data
  const handleContinueWatching = () => {
    if (continueLecture && continueProgress) {
      console.log('🎬 Navigating to lectures with resume data:', {
        lectureId: continueLecture._id,
        resumeTime: Math.floor(continueProgress.currentTime),
        lectureTitle: continueLecture.title
      });
      
      // Store resume data in localStorage for lectures page to use
      localStorage.setItem('resumeLectureData', JSON.stringify({
        lectureId: continueLecture._id,
        resumeTime: Math.floor(continueProgress.currentTime),
        lectureTitle: continueLecture.title,
        subject: continueLecture.subject
      }));
      
      // Navigate to lectures page
      navigate(`/studentdashboard/lectures`);
    } else {
      console.log('❌ No continue learning data available');
      navigate(`/studentdashboard/lectures`);
    }
  };



  useEffect(() => {

    const fetchContinue = async () => {

      try {

        const studentId = user?.id;

        if (!studentId) {
          console.log('❌ No studentId found, skipping continue learning fetch');
          setIsLoading(false);
          return;
        }

        console.log('🔄 Fetching continue learning data for student:', studentId);
        setIsLoading(true);
        setError(null);

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/progress/continue/${studentId}`,
        );

        console.log('✅ Continue learning API response:', res.data);

        setContinueLecture(res.data?.lecture || null);
        setContinueProgress(res.data?.progress || null);

        // Log the continue learning data
        if (res.data?.lecture && res.data?.progress) {
          console.log('📚 Continue learning data:', {
            lectureId: res.data.lecture._id,
            lectureTitle: res.data.lecture.title,
            subject: res.data.lecture.subject,
            currentTime: res.data.progress.currentTime,
            duration: res.data.progress.duration,
            percentage: Math.round((res.data.progress.currentTime / res.data.progress.duration) * 100)
          });
        } else {
          console.log('ℹ️  No continue learning data found');
        }

      } catch (err) {

        console.error('❌ Continue learning fetch error:', err);
        setError('Failed to load continue learning data');
        setContinueLecture(null);
        setContinueProgress(null);

      } finally {

        setIsLoading(false);

      }

    };



    fetchContinue();

  }, [user, refreshKey]);



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

        {isLoading ? (

          <div className="bg-white rounded-xl shadow p-5 sm:p-6">

            <div className="animate-pulse">

              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>

              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>

              <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>

              <div className="h-2 bg-gray-200 rounded w-2/3"></div>

            </div>

          </div>

        ) : error ? (

          <div className="bg-white rounded-xl shadow p-5 sm:p-6">

            <div className="flex items-center gap-3 text-red-600">

              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

              </svg>

              <span className="text-sm">{error}</span>

            </div>

            <button 

              onClick={() => window.location.reload()}

              className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 underline"

            >

              Try again

            </button>

          </div>

        ) : continueLecture && continueProgress ? (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="bg-white rounded-xl shadow p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center hover:shadow-lg transition-shadow duration-200"

          >

            <div className="w-full">

              <div className="flex items-start justify-between gap-3">

                <div className="flex-1">

                  <h3 className="font-medium text-gray-900 line-clamp-2">

                    {continueLecture.title}

                  </h3>

                  <div className="flex items-center gap-2 mt-1">

                    <p className="text-sm text-gray-500">

                      {continueLecture.subject}

                    </p>

                    <span className="text-xs text-gray-400">•</span>

                    <p className="text-xs text-gray-500">

                      {continueLecture.facultyName}

                    </p>

                  </div>

                </div>

                <div className="flex-shrink-0">

                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">

                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                    </svg>

                  </div>

                </div>

              </div>

              <div className="mt-4">

                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">

                  <span className="font-medium">Progress</span>

                  <span className="font-semibold">{continuePercent}%</span>

                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                  <motion.div

                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"

                    initial={{ width: 0 }}

                    animate={{ width: `${continuePercent}%` }}

                    transition={{ duration: 0.8, ease: "easeOut" }}

                  />

                </div>

                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">

                  <span>

                    {Math.floor(continueProgress.currentTime / 60)}:{String(Math.floor(continueProgress.currentTime % 60)).padStart(2, '0')} / 

                    {Math.floor(continueProgress.duration / 60)}:{String(Math.floor(continueProgress.duration % 60)).padStart(2, '0')}

                  </span>

                  <span>

                    {continuePercent === 100 ? '✅ Completed' : continuePercent > 75 ? '🔥 Almost done!' : continuePercent > 50 ? '📚 Halfway there' : '🎯 Just started'}

                  </span>

                </div>

              </div>

            </div>

            <button

              onClick={handleContinueWatching}

              className="bg-indigo-600 text-white px-6 py-3 rounded-lg w-full sm:w-auto font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"

            >

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

              </svg>

              Resume Learning

            </button>

          </motion.div>

        ) : (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="bg-white rounded-xl shadow p-8 sm:p-10 text-center"

          >

            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">

              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />

              </svg>

            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Learning Journey</h3>

            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">

              Begin watching lectures to track your progress and continue where you left off.

            </p>

            <button

              onClick={() => navigate(`/studentdashboard/lectures`)}

              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"

            >

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />

              </svg>

              Browse Lectures

            </button>

          </motion.div>

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