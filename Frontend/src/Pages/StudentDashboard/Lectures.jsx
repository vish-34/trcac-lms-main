import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import YouTube from "react-youtube";
import activityTracker from "../../utils/activityTracker.js";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Lectures() {

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState("3");
  const [selectedSubject, setSelectedSubject] = useState("");

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
          if (selectedSubject) {
            url += `&subject=${selectedSubject}`;
          }
        } else if (selectedSubject) {
          url += `?subject=${selectedSubject}`;
        }

        const res = await axios.get(url);
        console.log('Lectures API response:', res.data);
        console.log('Response status:', res.status);
        console.log('Response data type:', typeof res.data);
        console.log('Response data length:', Array.isArray(res.data) ? res.data.length : 'Not an array');
        
        setLectures(res.data || []);

        // Check for resume data from home page
        const resumeData = localStorage.getItem('resumeLectureData');
        if (resumeData) {
          try {
            const parsedResumeData = JSON.parse(resumeData);
            console.log('🎬 Found resume data from home page:', parsedResumeData);
            
            // Find the lecture in the fetched lectures
            const resumeLecture = res.data.find(lecture => lecture._id === parsedResumeData.lectureId);
            if (resumeLecture) {
              console.log('✅ Resume lecture found in fetched lectures:', resumeLecture.title);
              
              // Auto-select the lecture and set resume time
              setActiveLectureId(parsedResumeData.lectureId);
              setResumeAtSeconds(parsedResumeData.resumeTime);
              
              // Initialize tracking positions
              setLastValidPositions(prev => ({ ...prev, [parsedResumeData.lectureId]: parsedResumeData.resumeTime }));
              setLastTrackedPositions(prev => ({ ...prev, [parsedResumeData.lectureId]: parsedResumeData.resumeTime }));
              
              console.log(`📍 Auto-resumed lecture "${resumeLecture.title}" at ${parsedResumeData.resumeTime}s`);
              
              // Clear the resume data after using it
              localStorage.removeItem('resumeLectureData');
            } else {
              console.log('❌ Resume lecture not found in fetched lectures');
            }
          } catch (error) {
            console.error('❌ Error parsing resume data:', error);
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
      // Get current tracking data
      const lastPosition = lastTrackedPositions[lectureId] || 0;
      const lastValidPosition = lastValidPositions[lectureId] || 0;
      const videoStartTime = videoStartTimes[lectureId] || 0;
      const totalWatched = totalWatchTime[lectureId] || 0;
      
      // More lenient validation for normal playback
      const timeDiff = Math.abs(currentTime - lastPosition);
      const maxAllowedJump = 5; // Increased to 5 seconds for normal playback
      
      // Total watch time validation (must have watched at least 80% of video time)
      const requiredWatchTime = duration * 0.8;
      const hasSufficientWatchTime = totalWatched >= requiredWatchTime;
      
      // Sequential progress validation (more lenient)
      const isSequentialProgress = currentTime >= lastValidPosition - 10; // Allow 10 seconds backward
      
      // Completion validation (only mark complete if actually watched)
      const isNearEnd = currentTime >= duration * 0.95;
      const canComplete = isNearEnd && hasSufficientWatchTime;
      
      // First time initialization
      if (lastPosition === 0) {
        setLastValidPositions(prev => ({ ...prev, [lectureId]: currentTime }));
        setVideoStartTimes(prev => ({ ...prev, [lectureId]: Date.now() }));
        setTotalWatchTime(prev => ({ ...prev, [lectureId]: 0 }));
      }
      // Only block significant cheating attempts
      else if (timeDiff > maxAllowedJump && lastPosition > 0) {
        // Check if this is a significant forward jump (cheating)
        const isSignificantForwardJump = currentTime > lastValidPosition + 10;
        
        if (isSignificantForwardJump) {
          console.log(`🚫 CHEATING DETECTED: ${timeDiff}s jump from ${lastPosition}s to ${currentTime}s - Forcing back to ${lastValidPosition}s`);
          
          // Force back to last valid position
          const player = playerRefs[lectureId];
          if (player && player.seekTo) {
            player.seekTo(lastValidPosition, true);
            setIsSeeking(prev => ({ ...prev, [lectureId]: true }));
            setIsVideoLocked(prev => ({ ...prev, [lectureId]: true }));
            
            setTimeout(() => {
              setIsSeeking(prev => ({ ...prev, [lectureId]: false }));
              setIsVideoLocked(prev => ({ ...prev, [lectureId]: false }));
            }, 1000);
          }
          return; // Don't save cheated progress
        }
      }
      
      // Only save progress if validation passes
      const progressData = {
        studentId: user.id,
        lectureId,
        currentTime: Math.min(currentTime, duration), // Cap at duration
        duration,
        completed: canComplete // Only mark complete if all conditions met
      };
      
      console.log(`📤 Sending progress data to backend:`, progressData);
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/progress/upsert`, progressData);
      
      console.log(`✅ Backend response received for lecture ${lectureId}`);
      
      // Update tracking data
      setLastTrackedPositions(prev => ({ ...prev, [lectureId]: currentTime }));
      setLastValidPositions(prev => ({ ...prev, [lectureId]: currentTime }));
      
      // Update total watch time (increment by actual time watched)
      const timeIncrement = Math.min(timeDiff, 2); // Max 2 seconds per update
      setTotalWatchTime(prev => ({ ...prev, [lectureId]: totalWatched + timeIncrement }));
      
      console.log(`✅ Progress saved successfully: ${currentTime}s (${Math.round((currentTime/duration)*100)}%) - Total watched: ${Math.round(totalWatched + timeIncrement)}s`);
      
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
    console.log(`🎯 Selecting lecture: ${id}`);
    
    setActiveLectureId(id);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/progress/lecture/${user.id}/${id}`
      );

      const resumeTime = Math.floor(res.data?.progress?.currentTime || 0);
      console.log(`📊 Progress data for lecture ${id}:`, {
        currentTime: res.data?.progress?.currentTime,
        duration: res.data?.progress?.duration,
        resumeTime: resumeTime,
        completed: res.data?.progress?.completed
      });

      setResumeAtSeconds(resumeTime);
      
      // Initialize tracking positions immediately
      setLastValidPositions(prev => ({
        ...prev,
        [id]: resumeTime
      }));
      
      setLastTrackedPositions(prev => ({
        ...prev,
        [id]: resumeTime
      }));

      console.log(`📍 Set resume position for lecture ${id}: ${resumeTime}s`);

    } catch (error) {
      console.error(`❌ Error fetching progress for lecture ${id}:`, error);
      // Set default values if no progress found
      setResumeAtSeconds(0);
      setLastValidPositions(prev => ({
        ...prev,
        [id]: 0
      }));
      setLastTrackedPositions(prev => ({
        ...prev,
        [id]: 0
      }));
    }
  };


  // =======================



  // UI

  // =======================



  return (



    <div className="px-6 pt-10">



      <h1 className="text-2xl font-semibold mb-6">

        Lectures

      </h1>



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

          className="border px-4 py-3 rounded-lg mb-8"

        >

          <option value="">

            Select Subject

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



    <div className="grid gap-8">



      {lectures.length === 0 ? (

        <p className="text-gray-500">

          Select Semester & Subject

        </p>

      ) : (

        <>

          <p className="text-green-600 mb-4">
            Found {lectures.length} lecture(s)
          </p>
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
                    // Store player reference for progress tracking
                    setPlayerRefs(prev => ({
                      ...prev,
                      [lecture._id]: e.target
                    }));

                    // Resume from saved position if this is the active lecture
                    if (activeLectureId === lecture._id && resumeAtSeconds > 0) {
                      console.log(`🔄 Resuming lecture ${lecture._id} from ${resumeAtSeconds} seconds`);
                      
                      // Seek to resume position after a short delay to ensure player is ready
                      setTimeout(() => {
                        e.target.seekTo(resumeAtSeconds);
                        console.log(`✅ Resumed lecture ${lecture._id} at ${resumeAtSeconds}s`);
                      }, 500);
                    }

                    // Add seeking prevention - monitor time updates continuously
                    const checkForSeeking = setInterval(async () => {
                      try {
                        const player = playerRefs[lecture._id];
                        if (!player) return;
                        
                        const currentTime = await player.getCurrentTime();
                        const duration = await player.getDuration();
                        const playerState = await player.getPlayerState();
                        
                        // Skip checks if video is locked
                        if (isVideoLocked[lecture._id]) {
                          return;
                        }
                        
                        const lastValid = lastValidPositions[lecture._id] || 0;
                        const lastTracked = lastTrackedPositions[lecture._id] || 0;
                        
                        // Enhanced anti-cheating: Always check for seeking regardless of player state
                        // But allow normal pause/resume behavior
                        
                        // Calculate time difference since last check
                        const timeDiff = Math.abs(currentTime - lastTracked);
                        
                        // Very strict jump detection (2 seconds max for any jump)
                        const maxAllowedJump = 2;
                        
                        // Detect ANY significant time jump (cheating)
                        const isSignificantJump = timeDiff > maxAllowedJump && lastTracked > 0;
                        
                        // Detect backward jumps (prevent rewinding more than 3 seconds)
                        const isBackwardJump = currentTime < lastValid - 3;
                        
                        // Detect forward jumps (prevent skipping ahead more than 2 seconds)
                        const isForwardJump = currentTime > lastValid + maxAllowedJump;
                        
                        // Enhanced cheating detection - trigger on ANY violation
                        if (isSignificantJump || isBackwardJump || isForwardJump) {
                          console.log(`🚫 ROBUST CHEATING DETECTED:`);
                          console.log(`   - Current time: ${currentTime}s`);
                          console.log(`   - Last valid: ${lastValid}s`);
                          console.log(`   - Last tracked: ${lastTracked}s`);
                          console.log(`   - Time diff: ${timeDiff}s`);
                          console.log(`   - Backward jump: ${isBackwardJump}`);
                          console.log(`   - Forward jump: ${isForwardJump}`);
                          console.log(`   - Player state: ${playerState}`);
                          console.log(`   - Significant jump: ${isSignificantJump}`);
                          
                          // Force back to last valid position immediately
                          player.seekTo(lastValid, true);
                          setIsSeeking(prev => ({ ...prev, [lecture._id]: true }));
                          setIsVideoLocked(prev => ({ ...prev, [lecture._id]: true }));
                          
                          // Lock video longer for repeated cheating attempts
                          const lockDuration = Math.min(3000, timeDiff * 200); // Up to 3 seconds
                          setTimeout(() => {
                            setIsSeeking(prev => ({ ...prev, [lecture._id]: false }));
                            setIsVideoLocked(prev => ({ ...prev, [lecture._id]: false }));
                          }, lockDuration);
                          
                          return;
                        }
                        
                        // Update valid position if progress is legitimate and forward
                        if (currentTime >= lastValid && currentTime <= lastValid + maxAllowedJump) {
                          setLastValidPositions(prev => ({
                            ...prev,
                            [lecture._id]: currentTime
                          }));
                        }
                        
                        // Always update tracked position for legitimate progress
                        if (!isSignificantJump && !isBackwardJump && !isForwardJump) {
                          setLastTrackedPositions(prev => ({
                            ...prev,
                            [lecture._id]: currentTime
                          }));
                        }
                        
                      } catch (error) {
                        // Silent error handling for continuous monitoring
                        console.error('Enhanced seeking detection error:', error);
                      }
                    }, 200); // Check every 200ms for faster detection

                    // Store interval ID for cleanup
                    e.target.seekingCheckInterval = checkForSeeking;
                  }}
                  onStateChange={async (e) => {
                    console.log(`🎬 Video state changed for lecture ${lecture._id}:`, e.data);
                    
                    if (e.data === 0 || e.data === 2 || e.data === 1) {
                      const currentTime = await e.target.getCurrentTime();
                      const duration = await e.target.getDuration();
                      
                      console.log(`💾 Saving progress for lecture ${lecture._id}:`, {
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
            </div>
          ))}
        </>
      )}
    </div>
  </div>
);
}

