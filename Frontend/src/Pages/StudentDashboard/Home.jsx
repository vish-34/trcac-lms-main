import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";

import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";
import SubjectSlider from "../../Components/Studentdashboard/SubjectSlider.jsx";



export default function Home() {

  const { user, extractNameFromEmail } = useAuth();

  const navigate = useNavigate();



  const [continueLecture, setContinueLecture] = useState(null);

  const [continueProgress, setContinueProgress] = useState(null);

  const [lectureHistory, setLectureHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh

  const [dashboardStats, setDashboardStats] = useState({
    attendance: { percentage: 0, totalLectures: 0, presentLectures: 0 },
    lecturesCompleted: 0,
    assignments: { pending: 0, total: 0 },
    subjects: 0,
    subjectsInfo: { semesters: null, college: null }
  });



  const displayName = user?.fullName

    ? user.fullName

    : user?.email

      ? extractNameFromEmail(user.email)

      : "Student";



  // Function to refresh continue learning data
  const refreshContinueLearning = () => {
    console.log('Refreshing continue learning data...');
    setRefreshKey(prev => prev + 1);
  };

  // Function to navigate to lectures with resume data
  const handleContinueWatching = () => {
    if (continueLecture && continueProgress) {
      console.log('Navigating to lectures with resume data:', {
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
      console.log('No continue learning data available');
      navigate(`/studentdashboard/lectures`);
    }
  };



  useEffect(() => {

    const fetchData = async () => {

      try {

        const studentId = user?.id;

        console.log('User object:', user);
        console.log('User ID:', studentId);
        console.log('User ID type:', typeof studentId);
        console.log('User available fields:', user ? Object.keys(user) : 'No user object');

        if (!studentId) {
          console.log('No studentId found, skipping data fetch');
          setIsLoading(false);
          return;
        }

        console.log('Fetching data for student:', studentId);
        setIsLoading(true);
        setError(null);

        // Fetch continue learning data
        const continueRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/progress/continue/${studentId}`,
        );

        console.log('Continue learning API response:', continueRes.data);

        setContinueLecture(continueRes.data?.lecture || null);
        setContinueProgress(continueRes.data?.progress || null);

        // Fetch lecture history (first 2 items)
        const historyRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/progress/history/${studentId}`,
          { params: { page: 1, limit: 2 } }
        );

        console.log('Lecture history API response:', historyRes.data);
        setLectureHistory(historyRes.data.lectures || []);

        // Fetch dashboard statistics
        try {
          const statsRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/progress/dashboard-stats/${studentId}`
          );
          
          console.log('Dashboard statistics API response:', statsRes.data);
          console.log('Subjects info:', statsRes.data.subjectsInfo);
          setDashboardStats(statsRes.data);
        } catch (statsError) {
          console.error('Error fetching dashboard statistics:', statsError);
          // Continue with default values if stats fetch fails
        }

        // Log the continue learning data
        if (continueRes.data?.lecture && continueRes.data?.progress) {
          console.log('Continue learning data:', {
            lectureId: continueRes.data.lecture._id,
            lectureTitle: continueRes.data.lecture.title,
            subject: continueRes.data.lecture.subject,
            currentTime: continueRes.data.progress.currentTime,
            duration: continueRes.data.progress.duration,
            percentage: Math.round((continueRes.data.progress.currentTime / continueRes.data.progress.duration) * 100)
          });
        } else {
          console.log('No continue learning data found');
        }

      } catch (err) {

        console.error('Data fetch error:', err);
        setError('Failed to load data');
        setContinueLecture(null);
        setContinueProgress(null);
        setLectureHistory([]);

      } finally {

        setIsLoading(false);

      }

    };



    fetchData();

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

            Welcome back, {displayName} 

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Progress</h2>
          <button
            onClick={refreshContinueLearning}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            Refresh
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div

          className="

          grid

          grid-cols-2

          sm:grid-cols-2

          md:grid-cols-4

          gap-4 sm:gap-5

          "

        >

        {isLoading ? (
          // Loading skeleton for stats
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard

              title="Attendance"

              value={`${dashboardStats.attendance.percentage}%`}

              color="bg-yellow-100"

            />



            <StatCard

              title="Lectures Completed"

              value={dashboardStats.lecturesCompleted.toString()}

              color="bg-indigo-100"

            />



            <StatCard

              title="Assignments"

              value={`${dashboardStats.assignments.pending} Pending`}

              color="bg-pink-100"

            />



            <StatCard

              title="Subjects"

              value={dashboardStats.subjects.toString()}

              color="bg-purple-100"

              subtitle={
                dashboardStats.subjectsInfo.semesters && dashboardStats.subjectsInfo.semesters.length > 0
                  ? dashboardStats.subjectsInfo.semesters.join(' & ')
                  : dashboardStats.subjectsInfo.year
                    ? `Year ${dashboardStats.subjectsInfo.year}`
                    : 'All Subjects'
              }

            />
          </>
        )}

        </div>
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

        ) : lectureHistory.length > 0 ? (

          <div className="space-y-4">

            {/* Show first 2 lectures */}

            {lectureHistory.map((lecture, index) => (

              <motion.div

                key={lecture._id}

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1 }}

                className="bg-white rounded-xl shadow p-5 sm:p-6 hover:shadow-lg transition-shadow duration-200"

              >

                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-start">

                  <div className="flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex-1">

                        <h3 className="font-medium text-gray-900 line-clamp-2">

                          {lecture.title}

                        </h3>

                        <div className="flex items-center gap-2 mt-1">

                          <p className="text-sm text-gray-500">

                            {lecture.subject}

                          </p>

                          <span className="text-xs text-gray-400">•</span>

                          <p className="text-xs text-gray-500">

                            {lecture.facultyName}

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

                        <span className="font-semibold">{lecture.progress.percentageWatched}%</span>

                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

                        <motion.div

                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"

                          initial={{ width: 0 }}

                          animate={{ width: `${lecture.progress.percentageWatched}%` }}

                          transition={{ duration: 0.8, ease: "easeOut" }}

                        />

                      </div>

                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">

                        <span>

                          {lecture.progress.watchTime} / {lecture.progress.totalTime}

                        </span>

                        <span>

                          {lecture.progress.percentageWatched === 100 ? 'Completed' : lecture.progress.percentageWatched > 75 ? 'Almost done!' : lecture.progress.percentageWatched > 50 ? 'Halfway there' : 'Just started'}

                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="flex-shrink-0 mt-4 sm:mt-0">

                    <button

                      onClick={() => {

                        localStorage.setItem('resumeLectureData', JSON.stringify({

                          lectureId: lecture._id,

                          resumeTime: Math.floor(lecture.progress.currentTime),

                          lectureTitle: lecture.title,

                          subject: lecture.subject

                        }));

                        navigate(`/studentdashboard/lectures`);

                      }}

                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg w-full sm:w-auto font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"

                    >

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                      </svg>

                      {lecture.progress.percentageWatched === 100 ? 'Rewatch' : 'Continue'}

                    </button>

                  </div>

                </div>

              </motion.div>

            ))}

            

            {/* View All Button */}

            <div className="flex justify-center pt-2">

              <button

                onClick={() => navigate('/studentdashboard/lecture-history')}

                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"

              >

                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />

                </svg>

                View All Lectures

              </button>

            </div>

          </div>

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

      <SubjectSlider/>

    </div>

  );

}



function StatCard({ title, value, color, subtitle }) {

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

      {subtitle && (

        <p className="text-xs text-gray-500 mt-1">

          {subtitle}

        </p>

      )}

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
