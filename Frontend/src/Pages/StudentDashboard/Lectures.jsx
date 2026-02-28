import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import YouTube from "react-youtube";
import activityTracker from "../../utils/activityTracker.js";

export default function Lectures() {

  const { user } = useAuth();

  const [lectures, setLectures] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [activeLectureId, setActiveLectureId] = useState(null);
  const [resumeAtSeconds, setResumeAtSeconds] = useState(0);

  // =======================
  // SEMESTER OPTIONS
  // =======================

  const getSemesterOptions = () => {
    if (!user || user.college !== "Degree College") return [];

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
    if (user) {
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

        if (!user || !selectedSemester || !selectedSubject) return;

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/lecture/student/${user.id}`,
          {
            params: {
              semester: selectedSemester,
              subject: selectedSubject
            }
          }
        );

        setLectures(res.data);

      } catch (err) {
        console.log("Lecture fetch error:", err);
      }

    };

    fetchLectures();

  }, [selectedSemester, selectedSubject, user]);

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

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/progress/upsert`,
        {
          studentId: user.id,
          lectureId,
          currentTime,
          duration
        }
      );

    } catch { }

  };

  // =======================
  // RESUME SELECT
  // =======================

  const handleSelectLecture = async (id) => {

    setActiveLectureId(id);

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/progress/lecture/${user.id}/${id}`
    );

    setResumeAtSeconds(
      Math.floor(res.data?.progress?.currentTime || 0)
    );

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
          onChange={(e) => setSelectedSubject(e.target.value)}
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

      {/* LECTURES */}

      <div className="grid gap-8">

        {lectures.length === 0 ? (

          <p className="text-gray-500">
            Select Semester & Subject
          </p>

        ) : (

          lectures.map(lecture => (

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
                  onStateChange={async (e) => {

                    if (e.data === 0 || e.data === 2) {

                      const currentTime = await e.target.getCurrentTime();
                      const duration = await e.target.getDuration();

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

              <button
                onClick={() => handleSelectLecture(lecture._id)}
                className="text-indigo-600 mt-3 text-sm"
              >
                Resume from last watch
              </button>

            </div>

          ))

        )}

      </div>

    </div>

  );

}