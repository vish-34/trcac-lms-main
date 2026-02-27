import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSearchParams } from "react-router-dom";
import YouTube from "react-youtube";

export default function Lectures() {

    const [lectures, setLectures] = useState([]);
    const { user } = useAuth();

    const [searchParams, setSearchParams] = useSearchParams();

    const [activeLectureId, setActiveLectureId] = useState(null);
    const [resumeAtSeconds, setResumeAtSeconds] = useState(0);
    const [player, setPlayer] = useState(null);

    // =================
    // VIDEO ID
    // =================

    const getVideoId = (url) => {

        if (!url) return "";

        let videoId = "";

        try {

            if (url.includes("youtu.be")) {

                videoId = url.split("youtu.be/")[1]?.split("?")[0];

            }

            else if (url.includes("shorts")) {

                videoId = url.split("shorts/")[1]?.split("?")[0];

            }

            else if (url.includes("watch?v=")) {

                videoId = url.split("v=")[1]?.split("&")[0];

            }

            return videoId;

        } catch {

            return "";

        }

    };

    const fetchResumePoint = async (lectureId) => {
        try {
            const studentId = user?.id;
            if (!studentId || !lectureId) return 0;

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/progress/lecture/${studentId}/${lectureId}`
            );

            const seconds = Math.floor(res.data?.progress?.currentTime || 0);
            return Number.isFinite(seconds) ? seconds : 0;
        } catch (err) {
            console.log(err);
            return 0;
        }
    };

    const saveProgress = async ({ lectureId, currentTime, duration }) => {
        try {
            const studentId = user?.id;
            if (!studentId || !lectureId) return;

            await axios.post(`${import.meta.env.VITE_API_URL}/api/progress/upsert`, {
                studentId,
                lectureId,
                currentTime,
                duration,
            });
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!player || !activeLectureId) return;

        const intervalId = setInterval(async () => {
            try {
                const currentTime = await player.getCurrentTime();
                const duration = await player.getDuration();

                await saveProgress({
                    lectureId: activeLectureId,
                    currentTime,
                    duration,
                });
            } catch (err) {
                // ignore
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [player, activeLectureId]);

    const handleSelectLecture = async (lectureId) => {
        setActiveLectureId(lectureId);
        setPlayer(null);

        const seconds = await fetchResumePoint(lectureId);
        setResumeAtSeconds(seconds);

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("resume", lectureId);
            return next;
        });
    };

    // =================
    // FETCH
    // =================

    useEffect(() => {

        fetchLectures();

    }, [user]);

    useEffect(() => {
        const resumeId = searchParams.get("resume");
        if (resumeId) {
            handleSelectLecture(resumeId);
        }
    }, [searchParams]);

    const fetchLectures = async () => {

        try {

            // Use student ID for filtering
            const studentId = user?.id || 'mock-student-id';
            
            const res = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/lecture/student/${studentId}`

            );

            setLectures(res.data);

            const resumeId = searchParams.get("resume");
            if (resumeId) {
                handleSelectLecture(resumeId);
            }

        }
        catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="px-4 sm:px-6 md:px-8 pt-14 md:pt-0">

            <h1 className="text-xl sm:text-2xl font-semibold mb-6">

                Lectures

            </h1>



            <div className="grid gap-6 sm:gap-8">

                {

                    lectures.map((lecture) => (

                        <div

                            key={lecture._id}

                            className="
bg-white
rounded-2xl
shadow-md
p-4 sm:p-6
space-y-4
"

                        >

                            {/* TITLE */}

                            <h2 className="text-base sm:text-lg font-semibold">

                                {lecture.title}

                            </h2>



                            {/* SUBJECT + FACULTY */}

                            <div
                                className="
flex
flex-col
sm:flex-row
sm:gap-6
gap-1
text-sm
text-gray-500
"
                            >

                                <p>

                                    Subject : {lecture.subject}

                                </p>

                                {lecture.facultyName && (

                                    <p>

                                        Faculty : {lecture.facultyName}

                                    </p>

                                )}

                            </div>

                            {/* VIDEO PLAYER */}

                            <div

                                className="rounded-xl overflow-hidden"
                            >
                                <div className="relative w-full pt-[56.25%]">

                                    {activeLectureId === lecture._id ? (

                                        <div className="absolute top-0 left-0 w-full h-full">

                                            <YouTube

                                                videoId={getVideoId(lecture.youtubeLink)}

                                                opts={{
                                                    width: "100%",
                                                    height: "100%",
                                                    playerVars: {
                                                        rel: 0,
                                                        modestbranding: 1,
                                                        playsinline: 1,
                                                        start: resumeAtSeconds || 0,
                                                    },
                                                }}

                                                className="absolute top-0 left-0 w-full h-full"

                                                iframeClassName="w-full h-full"

                                                onReady={async (event) => {
                                                    setPlayer(event.target);

                                                    if (resumeAtSeconds && resumeAtSeconds > 0) {
                                                        try {
                                                            event.target.seekTo(resumeAtSeconds, true);
                                                        } catch (err) {
                                                            // ignore
                                                        }
                                                    }
                                                }}

                                                onStateChange={async (event) => {
                                                    if (event.data === 0) {
                                                        try {
                                                            const duration = await event.target.getDuration();
                                                            await saveProgress({
                                                                lectureId: lecture._id,
                                                                currentTime: duration,
                                                                duration,
                                                            });
                                                        } catch (err) {
                                                            // ignore
                                                        }
                                                    }
                                                }}

                                            />

                                        </div>

                                    ) : (

                                        <div className="absolute top-0 left-0 w-full h-full">

                                            <YouTube

                                                videoId={getVideoId(lecture.youtubeLink)}

                                                opts={{
                                                    width: "100%",
                                                    height: "100%",
                                                    playerVars: {
                                                        rel: 0,
                                                        modestbranding: 1,
                                                        playsinline: 1,
                                                    },
                                                }}

                                                className="absolute top-0 left-0 w-full h-full"

                                                iframeClassName="w-full h-full"

                                            />

                                        </div>

                                    )}

                                </div>
                            </div>

                            {activeLectureId !== lecture._id && (

                                <div className="flex justify-end">

                                    <button

                                        type="button"

                                        onClick={() => handleSelectLecture(lecture._id)}

                                        className="text-indigo-600 text-sm font-semibold"

                                    >

                                        Resume from last watch

                                    </button>

                                </div>

                            )}

                        </div>

                    ))

                }

            </div>

        </div>

    );

}