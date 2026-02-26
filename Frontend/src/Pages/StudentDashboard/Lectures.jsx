import { useEffect, useState } from "react";
import axios from "axios";

export default function Lectures() {

    const [lectures, setLectures] = useState([]);

    const studentClass = "BScCSFY";


    // =================
    // EMBED LINK
    // =================

    const getEmbedLink = (url) => {

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

            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&playsinline=1`;

        } catch {

            return "";

        }

    };


    // =================
    // FETCH
    // =================

    useEffect(() => {

        fetchLectures();

    }, []);



    const fetchLectures = async () => {

        try {

            const res = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/lecture/student/${studentClass}`

            );

            setLectures(res.data);

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

                            <div className="rounded-xl overflow-hidden">

                                {/* Responsive 16:9 Video */}

                                <div className="relative w-full pt-[56.25%]">

                                    <iframe

                                        loading="lazy"

                                        src={getEmbedLink(lecture.youtubeLink)}

                                        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"

                                        allowFullScreen

                                        className="
absolute
top-0
left-0
w-full
h-full
border-0
"

                                    ></iframe>

                                </div>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}