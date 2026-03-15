import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import YouTube from "react-youtube";
import activityTracker from "../../utils/activityTracker.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Lectures = () => {

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allLectures, setAllLectures] = useState([]); // Store all lectures for client-side filtering
  const [lectureProgress, setLectureProgress] = useState({}); // Store progress for each lecture

  const [selectedSemester, setSelectedSemester] = useState("3");
  const [selectedSubject, setSelectedSubject] = useState("");

  // New filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, not-started, in-progress, completed
  const [dateFilter, setDateFilter] = useState("all"); // all, recent, week, month, custom
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, title, progress
  const [facultyFilter, setFacultyFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("all"); // all, short, medium, long
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activeLectureId, setActiveLectureId] = useState(null);
  const [resumeAtSeconds, setResumeAtSeconds] = useState(0);
  const [progressIntervals, setProgressIntervals] = useState({});
  const [lastTrackedPositions, setLastTrackedPositions] = useState({});
  const [playerRefs, setPlayerRefs] = useState({});
  const [isSeeking, setIsSeeking] = useState({});
  const [lastValidPositions, setLastValidPositions] = useState({});
  const [videoStartTimes, setVideoStartTimes] = useState({});
  const [totalWatchTime, setTotalWatchTime] = useState({});
  const [isVideoLocked, setIsVideoLocked] = useState({});

  const querypage = (lecture) => {
    navigate(`/queries?lectureId=${lecture._id}`, {
      state: {
        lecture,
      },
    });
  }

  // =======================

  // SEMESTER OPTIONS

  // =======================



  const getSemesterOptions = () => {

    if (!user || user.college !== "Degree College") return [];

    

    // Return all available semesters based on year

    if (user.year === "FY") return [1, 2];

    if (user.year === "SY") return [3, 4];

    if (user.year === "TY") return [5, 6];

    

    return [];

  };



  const semesterOptions = getSemesterOptions();



  // =======================

  // ACTIVITY TRACKER

  // =======================



  useEffect(() => {

    console.log('Component mounted, user:', user);

    console.log('Current state:', { 

      selectedSemester, 

      selectedSubject, 

      lecturesLength: lectures.length,

      activeLectureId,

      resumeAtSeconds 

    });

  }, [user, selectedSemester, selectedSubject, lectures.length, activeLectureId, resumeAtSeconds]);



  useEffect(() => {

    if (user) {

      console.log('Setting user in activity tracker');

      activityTracker.setUser(user);

    }

  }, [user]);



  // =======================

  // FETCH SUBJECTS

  // =======================



  useEffect(() => {



    const fetchSubjects = async () => {



      try {



        if (!user || !selectedSemester) return;



        const params = {

          collegeType: "degree",

          year: user.year,

          semester: selectedSemester,

          courseOrStream: user.degree

        };



        const res = await axios.get(

          `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`,

          { params }

        );



        if (res.data.success) {

          setSubjects(res.data.subjects);

          

          // Auto-select first subject if no subject is selected

          if (!selectedSubject && res.data.subjects.length > 0) {

            setSelectedSubject(res.data.subjects[0].subjectName);

          }

        }



      } catch (err) {

        console.log("Subject fetch error:", err);

      }



    };



    fetchSubjects();



  }, [selectedSemester, user]);



  // =======================

  // FETCH LECTURES (NEW CORRECT VERSION)

  // =======================



  useEffect(() => {
    const fetchLectures = async () => {
      try {
        console.log('Fetching lectures for:', { 
          userId: user?.id, 
          selectedSemester, 
          selectedSubject 
        });
        
        let url = `${import.meta.env.VITE_API_URL}/api/lecture/student/${user.id}`;
        
        if (selectedSemester) {
          url += `?semester=${selectedSemester}`;
          // Only add subject filter if a specific subject is selected (not empty string)
          if (selectedSubject && selectedSubject.trim() !== "") {
            url += `&subject=${encodeURIComponent(selectedSubject)}`;
          }
        }

        const res = await axios.get(url);
        console.log('Lectures API response:', res.data);
        console.log('Response status:', res.status);
        console.log('Response data type:', typeof res.data);
        console.log('Response data length:', Array.isArray(res.data) ? res.data.length : 'Not an array');
        
        const fetchedLectures = res.data || [];
        setAllLectures(fetchedLectures); // Store all lectures for filtering
        
        // Fetch progress for all lectures
        await fetchAllLecturesProgress(fetchedLectures);

        // Check for resume data from home page
        const resumeData = localStorage.getItem('resumeLectureData');
        if (resumeData) {
          try {
            const parsedResumeData = JSON.parse(resumeData);
            console.log('Found resume data from home page:', parsedResumeData);
            
            // Find the lecture in the fetched lectures
            const resumeLecture = fetchedLectures.find(lecture => lecture._id === parsedResumeData.lectureId);
            if (resumeLecture) {
              console.log('Resume lecture found in fetched lectures:', resumeLecture.title);
              
              // Auto-select the lecture and set resume time
              setActiveLectureId(parsedResumeData.lectureId);
              setResumeAtSeconds(parsedResumeData.resumeTime);
              
              // Initialize tracking positions
              setLastValidPositions(prev => ({ ...prev, [parsedResumeData.lectureId]: parsedResumeData.resumeTime }));
              setLastTrackedPositions(prev => ({ ...prev, [parsedResumeData.lectureId]: parsedResumeData.resumeTime }));
              
              console.log(`Auto-resumed lecture "${resumeLecture.title}" at ${parsedResumeData.resumeTime}s`);
              
              // Clear the resume data after using it
              localStorage.removeItem('resumeLectureData');
            } else {
              console.log('Resume lecture not found in fetched lectures');
            }
          } catch (error) {
            console.error('Error parsing resume data:', error);
            localStorage.removeItem('resumeLectureData');
          }
        }

      } catch (err) {
        console.error("Error fetching lectures:", err);
        console.error("Error data:", err.response?.data);
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, [selectedSemester, selectedSubject, user]);

  // =======================
  // HANDLE RESUME PARAMETER FROM URL
  // =======================

  useEffect(() => {
    const resumeLectureId = searchParams.get('resume');
    if (resumeLectureId && lectures.length > 0) {
      // Find the lecture in the current lectures list
      const lecture = lectures.find(l => l._id === resumeLectureId);
      if (lecture) {
        console.log('Auto-resuming lecture from URL parameter:', resumeLectureId);
        handleSelectLecture(resumeLectureId);
        
        // Clear the resume parameter from URL
        searchParams.delete('resume');
        navigate(`${window.location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    }
  }, [searchParams, lectures, navigate]);

  // =======================

  // VIDEO ID

  // =======================



  const getVideoId = (url) => {



    if (!url) return "";



    if (url.includes("youtu.be"))

      return url.split("youtu.be/")[1]?.split("?")[0];



    if (url.includes("shorts"))

      return url.split("shorts/")[1]?.split("?")[0];



    if (url.includes("watch?v="))

      return url.split("v=")[1]?.split("&")[0];



    return "";

  };



  // =======================

  // SAVE PROGRESS

  // =======================



  const saveProgress = async ({ lectureId, currentTime, duration }) => {
    try {
      console.log(`Saving progress for lecture ${lectureId}: ${currentTime}s/${duration}s`);
      
      const progressData = {
        studentId: user.id,
        lectureId,
        currentTime: Math.min(currentTime, duration),
        duration,
        completed: currentTime >= duration * 0.95
      };
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/progress/upsert`, progressData);
      console.log(`Progress saved successfully`);
      
      // Show attendance notification if attendance was just marked
      if (response.data.attendanceMarked) {
        console.log(`Attendance marked for lecture ${lectureId}`);
        // You could show a toast notification here if you have one
        // For now, we'll just log it
      }
      
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };



  // =======================

  // PROGRESS TRACKING WITH TIMER
  // =======================



  const startProgressTracking = (lectureId) => {
    // Clear any existing interval for this lecture
    if (progressIntervals[lectureId]) {
      clearInterval(progressIntervals[lectureId]);
    }

    // Start new interval for progress tracking using react-youtube player refs
    const interval = setInterval(async () => {
      try {
        const player = playerRefs[lectureId];
        if (player && player.getCurrentTime && player.getDuration) {
          const currentTime = await player.getCurrentTime();
          const duration = await player.getDuration();
          
          await saveProgress({
            lectureId,
            currentTime,
            duration
          });

          await activityTracker.trackLectureView(
            lectureId,
            lectures.find(l => l._id === lectureId)?.title || 'Unknown',
            lectures.find(l => l._id === lectureId)?.subject || 'Unknown',
            currentTime,
            duration
          );
        }
      } catch (error) {
        console.log('Progress tracking error:', error);
      }
    }, 5000); // Track every 5 seconds

    setProgressIntervals(prev => ({
      ...prev,
      [lectureId]: interval
    }));
  };



  const stopProgressTracking = (lectureId) => {

    if (progressIntervals[lectureId]) {

      clearInterval(progressIntervals[lectureId]);

      setProgressIntervals(prev => {

        const updated = { ...prev };

        delete updated[lectureId];

        return updated;

      });

    }

  };



  // Clean up intervals on unmount

  useEffect(() => {

    return () => {

      // Clean up all progress tracking intervals

      Object.values(progressIntervals).forEach(interval => {

        if (interval) clearInterval(interval);

      });

      setProgressIntervals({});

    };

  }, []);



  // Start tracking when active lecture changes

  useEffect(() => {

    if (activeLectureId) {

      startProgressTracking(activeLectureId);

    }

    

    // Stop tracking for previous lecture when active lecture changes

    return () => {

      Object.keys(progressIntervals).forEach(lectureId => {

        if (lectureId !== activeLectureId) {

          stopProgressTracking(lectureId);

        }

      });

    };

  }, [activeLectureId]);



  // Stop all tracking when lectures are reset

  useEffect(() => {

    if (lectures.length === 0) {

      // Stop all tracking when lectures list is cleared

      Object.keys(progressIntervals).forEach(lectureId => {

        stopProgressTracking(lectureId);

      });

      setProgressIntervals({});

    }

  }, [lectures]);



  // =======================

  // RESUME SELECT

  // =======================



  const handleSelectLecture = async (id) => {
    console.log(`Selecting lecture: ${id}`);
    
    setActiveLectureId(id);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/progress/lecture/${user.id}/${id}`
      );

      const resumeTime = Math.floor(res.data?.progress?.currentTime || 0);
      console.log(`Progress data for lecture ${id}:`, {
        currentTime: res.data?.progress?.currentTime,
        duration: res.data?.progress?.duration,
        resumeTime: resumeTime,
        completed: res.data?.progress?.completed
      });

      setResumeAtSeconds(resumeTime);
      console.log(`Set resume position for lecture ${id}: ${resumeTime}s`);

    } catch (error) {
      console.error(`Error fetching progress for lecture ${id}:`, error);
      setResumeAtSeconds(0);
    }
  };

  // =======================
  // FILTERING & SORTING LOGIC
  // =======================

  // Fetch progress for all lectures
  const fetchAllLecturesProgress = async (lectureList) => {
    const progressData = {};
    try {
      const progressPromises = lectureList.map(async (lecture) => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/progress/lecture/${user.id}/${lecture._id}`
          );
          return {
            lectureId: lecture._id,
            progress: res.data?.progress || { currentTime: 0, duration: 1, completed: false }
          };
        } catch (error) {
          return {
            lectureId: lecture._id,
            progress: { currentTime: 0, duration: 1, completed: false }
          };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      progressResults.forEach(({ lectureId, progress }) => {
        progressData[lectureId] = progress;
      });
      
      setLectureProgress(progressData);
      console.log(`Progress fetched for ${progressResults.length} lectures`);
    } catch (error) {
      console.error('Error fetching lecture progress:', error);
    }
  };

  // Get unique faculty names from lectures
  const getUniqueFaculties = () => {
    const faculties = [...new Set(allLectures.map(lecture => lecture.facultyName).filter(Boolean))];
    return faculties.sort();
  };

  // Get lecture status based on progress
  const getLectureStatus = (lectureId) => {
    const progress = lectureProgress[lectureId];
    if (!progress || progress.currentTime === 0) return 'not-started';
    if (progress.completed) return 'completed';
    return 'in-progress';
  };

  // Get lecture duration category
  const getDurationCategory = (lectureId) => {
    const progress = lectureProgress[lectureId];
    const duration = progress?.duration || 0;
    if (duration === 0) return 'unknown';
    if (duration < 1800) return 'short'; // < 30 minutes
    if (duration < 3600) return 'medium'; // 30-60 minutes
    return 'long'; // > 60 minutes
  };

  // Filter and sort lectures
  const getFilteredAndSortedLectures = () => {
    let filtered = [...allLectures];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lecture =>
        lecture.title.toLowerCase().includes(query) ||
        lecture.facultyName.toLowerCase().includes(query) ||
        lecture.subject.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lecture => {
        const status = getLectureStatus(lecture._id);
        return status === statusFilter;
      });
    }

    // Faculty filter
    if (facultyFilter) {
      filtered = filtered.filter(lecture => lecture.facultyName === facultyFilter);
    }

    // Duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter(lecture => {
        const category = getDurationCategory(lecture._id);
        return category === durationFilter;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'recent':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'custom':
          if (customDateRange.start) {
            startDate = new Date(customDateRange.start);
          }
          break;
      }

      filtered = filtered.filter(lecture => {
        const lectureDate = new Date(lecture.createdAt);
        const endDate = customDateRange.end ? new Date(customDateRange.end) : now;
        return lectureDate >= startDate && lectureDate <= endDate;
      });
    }

    // Sort lectures
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          const aProgress = lectureProgress[a._id]?.currentTime || 0;
          const bProgress = lectureProgress[b._id]?.currentTime || 0;
          return bProgress - aProgress;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    const filtered = getFilteredAndSortedLectures();
    setLectures(filtered);
  }, [allLectures, searchQuery, statusFilter, dateFilter, customDateRange, sortBy, facultyFilter, durationFilter, lectureProgress]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDateRange({ start: "", end: "" });
    setSortBy("newest");
    setFacultyFilter("");
    setDurationFilter("all");
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    if (facultyFilter) count++;
    if (durationFilter !== "all") count++;
    return count;
  };


  // =======================



  // UI

  // =======================



  return (



    <div className="px-6 pt-10">



      <h1 className="text-2xl font-semibold mb-6">

        Lectures

      </h1>



      {/* ENHANCED FILTERING SECTION */}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">

        {/* Search and Quick Filters */}

        <div className="flex flex-col lg:flex-row gap-4 mb-4">

          {/* Search Bar */}

          <div className="flex-1">

            <div className="relative">

              <input

                type="text"

                placeholder="Search lectures, faculty, or subjects..."

                value={searchQuery}

                onChange={(e) => setSearchQuery(e.target.value)}

                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

              />

              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

              </svg>

            </div>

          </div>



          {/* Status Filter */}

          <select

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value)}

            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

          >

            <option value="all">All Status</option>

            <option value="not-started">Not Started</option>

            <option value="in-progress">In Progress</option>

            <option value="completed">Completed</option>

          </select>



          {/* Sort By */}

          <select

            value={sortBy}

            onChange={(e) => setSortBy(e.target.value)}

            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

          >

            <option value="newest">Newest First</option>

            <option value="oldest">Oldest First</option>

            <option value="title">Title A-Z</option>

            <option value="progress">Most Progress</option>

          </select>



          {/* Advanced Filters Toggle */}

          <button

            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}

            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"

          >

            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />

            </svg>

            Advanced Filters

            {getActiveFiltersCount() > 0 && (

              <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">

                {getActiveFiltersCount()}

              </span>

            )}

          </button>

        </div>



        {/* Active Filters Display */}

        {getActiveFiltersCount() > 0 && (

          <div className="flex flex-wrap gap-2 mb-4">

            {searchQuery && (

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">

                Search: {searchQuery}

                <button

                  onClick={() => setSearchQuery("")}

                  className="ml-1 hover:text-indigo-600"

                >

                  ×

                </button>

              </span>

            )}

            {statusFilter !== "all" && (

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">

                Status: {statusFilter.replace('-', ' ')}

                <button

                  onClick={() => setStatusFilter("all")}

                  className="ml-1 hover:text-indigo-600"

                >

                  ×

                </button>

              </span>

            )}

            {facultyFilter && (

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">

                Faculty: {facultyFilter}

                <button

                  onClick={() => setFacultyFilter("")}

                  className="ml-1 hover:text-indigo-600"

                >

                  ×

                </button>

              </span>

            )}

            {durationFilter !== "all" && (

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">

                Duration: {durationFilter}

                <button

                  onClick={() => setDurationFilter("all")}

                  className="ml-1 hover:text-indigo-600"

                >

                  ×

                </button>

              </span>

            )}

            {dateFilter !== "all" && (

              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">

                Date: {dateFilter}

                <button

                  onClick={() => setDateFilter("all")}

                  className="ml-1 hover:text-indigo-600"

                >

                  ×

                </button>

              </span>

            )}

            <button

              onClick={resetFilters}

              className="text-sm text-red-600 hover:text-red-800"

            >

              Reset All

            </button>

          </div>

        )}



        {/* Advanced Filters Panel */}

        <AnimatePresence>

          {showAdvancedFilters && (

            <motion.div

              initial={{ opacity: 0, height: 0 }}

              animate={{ opacity: 1, height: "auto" }}

              exit={{ opacity: 0, height: 0 }}

              className="border-t pt-4 space-y-4"

            >

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Faculty Filter */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>

                  <select

                    value={facultyFilter}

                    onChange={(e) => setFacultyFilter(e.target.value)}

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

                  >

                    <option value="">All Faculties</option>

                    {getUniqueFaculties().map(faculty => (

                      <option key={faculty} value={faculty}>{faculty}</option>

                    ))}

                  </select>

                </div>



                {/* Duration Filter */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>

                  <select

                    value={durationFilter}

                    onChange={(e) => setDurationFilter(e.target.value)}

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

                  >

                    <option value="all">All Durations</option>

                    <option value="short">Short (&lt; 30 min)</option>

                    <option value="medium">Medium (30-60 min)</option>

                    <option value="long">Long (&gt; 60 min)</option>

                  </select>

                </div>



                {/* Date Filter */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>

                  <select

                    value={dateFilter}

                    onChange={(e) => setDateFilter(e.target.value)}

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

                  >

                    <option value="all">All Time</option>

                    <option value="recent">Recent (7 days)</option>

                    <option value="week">This Week</option>

                    <option value="month">This Month</option>

                    <option value="custom">Custom Range</option>

                  </select>

                </div>

              </div>



              {/* Custom Date Range */}

              {dateFilter === "custom" && (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>

                    <input

                      type="date"

                      value={customDateRange.start}

                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}

                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>

                    <input

                      type="date"

                      value={customDateRange.end}

                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}

                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

                    />

                  </div>

                </div>

              )}

            </motion.div>

          )}

        </AnimatePresence>



        {/* Results Count */}

        <div className="text-sm text-gray-600 border-t pt-3">

          Showing {lectures.length} of {allLectures.length} lectures

          {getActiveFiltersCount() > 0 && ` • ${getActiveFiltersCount()} filter${getActiveFiltersCount() > 1 ? 's' : ''} applied`}

        </div>

      </div>



      {/* SEMESTER TOGGLE */}



      {user?.college === "Degree College" && (



        <div className="flex gap-2 mb-6 flex-wrap">



          {semesterOptions.map(sem => (



            <button

              key={sem}

              onClick={() => {

                setSelectedSemester(sem);

                setSelectedSubject("");

                setLectures([]);

                setActiveLectureId(null);

                setResumeAtSeconds(0);

              }}

              className={`px-5 py-2 rounded-full ${

                selectedSemester === sem

                  ? "bg-indigo-600 text-white"

                  : "bg-gray-100"

              }`}

            >

              Semester {sem}

            </button>



          ))}



        </div>



      )}



      {/* SUBJECT SELECT */}





      {subjects.length > 0 && (





        <select

          value={selectedSubject}

          onChange={(e) => {

            setSelectedSubject(e.target.value);

            setLectures([]);

            setActiveLectureId(null);

            setResumeAtSeconds(0);

          }}

          className="border px-4 py-3 rounded-lg mb-8 w-full md:w-auto"

        >

          <option value="">

            All Subjects

          </option>

          {subjects.map(sub => (

            <option

              key={sub._id}

              value={sub.subjectName}

            >

              {sub.subjectName}

            </option>

          ))}

        </select>





      )}








      {lectures.length === 0 ? (

        <p className="text-gray-500">
          {selectedSubject ? `No lectures found for ${selectedSubject}` : 'No lectures found for this semester'}
        </p>

      ) : (

        <>

          <p className="text-green-600 mb-4">
            Found {lectures.length} lecture(s)
          </p>
          <div className="grid gap-8">
            {lectures.map(lecture => (
              <div
                key={lecture._id}
                className="bg-white shadow rounded-2xl p-6"
              >
                <h2 className="font-semibold">
                  {lecture.title}
                </h2>
                <p className="text-sm text-gray-500">
                  Faculty : {lecture.facultyName}
                </p>
                <div className="relative w-full pt-[56.25%] mt-4">
                  <YouTube
                    videoId={getVideoId(lecture.youtubeLink)}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        start:
                          activeLectureId === lecture._id
                            ? resumeAtSeconds
                            : 0
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-full"
                    iframeClassName="w-full h-full"
                    onReady={(e) => {
                      console.log(`Video ready - Lecture ${lecture._id}`);
                      
                      // Store player reference
                      setPlayerRefs(prev => ({
                        ...prev,
                        [lecture._id]: e.target
                      }));

                      // SIMPLE RESUME SYSTEM
                      if (activeLectureId === lecture._id && resumeAtSeconds > 0) {
                        console.log(`Resuming lecture ${lecture._id} from ${resumeAtSeconds} seconds`);
                        
                        // Simple direct resume
                        setTimeout(() => {
                          e.target.seekTo(resumeAtSeconds, true);
                          console.log(`Resumed at ${resumeAtSeconds}s`);
                        }, 1000);
                      }

                      // SIMPLE ANTI-SEEKING SYSTEM
                      let lastKnownTime = resumeAtSeconds || 0;
                      let isResuming = true;
                      
                      // Resume protection for first 3 seconds
                      setTimeout(() => {
                        isResuming = false;
                        console.log(`🔓 Resume protection ended`);
                      }, 3000);

                      const preventSeeking = setInterval(async () => {
                        try {
                          if (isVideoLocked[lecture._id]) return;
                          
                          const currentTime = await e.target.getCurrentTime();
                          const playerState = await e.target.getPlayerState();
                          
                          // Don't check during resume protection
                          if (isResuming) {
                            lastKnownTime = currentTime;
                            return;
                          }
                          
                          // Simple time jump detection
                          const timeDiff = Math.abs(currentTime - lastKnownTime);
                          
                          if (timeDiff > 3 && lastKnownTime > 0) {
                            console.log(`🚫 Seeking detected! Jump from ${lastKnownTime}s to ${currentTime}s`);
                            
                            // Force back to last known position
                            e.target.seekTo(lastKnownTime, true);
                            setIsVideoLocked(prev => ({ ...prev, [lecture._id]: true }));
                            
                            setTimeout(() => {
                              setIsVideoLocked(prev => ({ ...prev, [lecture._id]: false }));
                            }, 2000);
                            
                            return;
                          }
                          
                          // Update last known time for legitimate progress
                          if (currentTime >= lastKnownTime) {
                            lastKnownTime = currentTime;
                          }
                          
                        } catch (error) {
                          console.error('Anti-seeking error:', error);
                        }
                      }, 500);

                      // Store interval for cleanup
                      e.target.seekingPrevention = preventSeeking;
                    }}
                    onStateChange={async (e) => {
                      console.log(`Video state changed for lecture ${lecture._id}:`, e.data);
                      
                      if (e.data === 0 || e.data === 2 || e.data === 1) {
                        const currentTime = await e.target.getCurrentTime();
                        const duration = await e.target.getDuration();
                        
                        console.log(`Saving progress for lecture ${lecture._id}:`, {
                          currentTime,
                          duration,
                          percentage: Math.round((currentTime / duration) * 100),
                          state: e.data === 0 ? 'ended' : e.data === 2 ? 'paused' : 'playing'
                        });
                        
                        await saveProgress({
                          lectureId: lecture._id,
                          currentTime,
                          duration
                        });
                        
                        await activityTracker.trackLectureView(
                          lecture._id,
                          lecture.title,
                          lecture.subject,
                          currentTime,
                          duration
                        );
                      }
                    }}
                  />
                </div>
                {/* ask a query  */}
                 <button onClick={() => querypage(lecture)} className="text-indigo-600 hover:text-indigo-800 mt-2 font-medium">
                        Ask a query 
                      </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
)
}

export default Lectures;
