import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminSubjects() {

    const navigate = useNavigate();

    const [mode, setMode] = useState("degree");

    const [degreeYear, setDegreeYear] = useState("FY");
    const [semester, setSemester] = useState("1");
    const [course, setCourse] = useState("B.Sc (CS)");

    const [jcYear, setJcYear] = useState("FYJC");
    const [stream, setStream] = useState("Commerce");

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const addsubject = () => {
        navigate("/admindashboard/addsubjects");
    };

    // Auto change semester when year changes
    useEffect(() => {
        if (degreeYear === "FY") setSemester("1");
        if (degreeYear === "SY") setSemester("3");
        if (degreeYear === "TY") setSemester("5");
    }, [degreeYear]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);

            let params = {};

            if (mode === "degree") {
                params = {
                    collegeType: "degree",
                    year: degreeYear,
                    semester: semester,
                    courseOrStream: course
                };
            } else {
                params = {
                    collegeType: "junior",
                    year: jcYear,
                    courseOrStream: stream
                };
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`,
                { params }
            );

            if (response.data.success) {
                setSubjects(response.data.subjects);
            }

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [mode, degreeYear, semester, course, jcYear, stream]);

    return (
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-10">

            <div className="max-w-6xl mx-auto space-y-8">

                <h1 className="text-2xl font-semibold">
                    Subject Management
                </h1>

                {/* TOGGLE */}
                <div className="flex bg-gray-100 rounded-full p-1 w-fit">
                    {["degree", "junior"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setMode(tab)}
                            className={`px-6 py-2 rounded-full capitalize transition ${mode === tab
                                    ? "bg-white shadow font-medium"
                                    : "text-gray-500"
                                }`}
                        >
                            {tab === "degree" ? "Degree College" : "Junior College"}
                        </button>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                >

                    {/* DEGREE */}
                    {mode === "degree" && (

                        <div className="space-y-6">

                            <div className="grid sm:grid-cols-3 gap-4">

                                {/* YEAR */}
                                <select
                                    value={degreeYear}
                                    onChange={(e) => setDegreeYear(e.target.value)}
                                    className="border rounded-lg px-4 py-3"
                                >
                                    <option value="FY">First Year</option>
                                    <option value="SY">Second Year</option>
                                    <option value="TY">Third Year</option>
                                </select>

                                {/* SEMESTER */}
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    className="border rounded-lg px-4 py-3"
                                >
                                    {degreeYear === "FY" && (
                                        <>
                                            <option value="1">Semester 1</option>
                                            <option value="2">Semester 2</option>
                                        </>
                                    )}
                                    {degreeYear === "SY" && (
                                        <>
                                            <option value="3">Semester 3</option>
                                            <option value="4">Semester 4</option>
                                        </>
                                    )}
                                    {degreeYear === "TY" && (
                                        <>
                                            <option value="5">Semester 5</option>
                                            <option value="6">Semester 6</option>
                                        </>
                                    )}
                                </select>

                                {/* COURSE */}
                                <select
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    className="border rounded-lg px-4 py-3"
                                >
                                    <option value="B.Sc (CS)">B.Sc (CS)</option>
                                    <option value="B.Sc (IT)">B.Sc (IT)</option>
                                    <option value="BA">BA</option>
                                    <option value="BAMMC">BAMMC</option>
                                    <option value="BCom">BCom</option>
                                    <option value="BMS">BMS</option>
                                    <option value="BAF">BAF</option>
                                </select>

                            </div>

                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-lg">Subjects</h2>
                                <button
                                    onClick={addsubject}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
                                >
                                    + Add Subject
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : subjects.length === 0 ? (
                                    <p className="text-gray-500">No Subjects Found</p>
                                ) : (
                                    subjects.map(sub => (
                                        <div
                                            key={sub._id}
                                            className="border rounded-xl p-4 hover:shadow"
                                        >
                                            {sub.subjectName}
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    )}

                    {/* JUNIOR */}
                    {mode === "junior" && (

                        <div className="space-y-6">

                            <div className="grid sm:grid-cols-2 gap-4">

                                <select
                                    value={jcYear}
                                    onChange={(e) => setJcYear(e.target.value)}
                                    className="border rounded-lg px-4 py-3"
                                >
                                    <option value="FYJC">FYJC</option>
                                    <option value="SYJC">SYJC</option>
                                </select>

                                <select
                                    value={stream}
                                    onChange={(e) => setStream(e.target.value)}
                                    className="border rounded-lg px-4 py-3"
                                >
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                </select>

                            </div>

                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-lg">Subjects</h2>
                                <button
                                    onClick={addsubject}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
                                >
                                    + Add Subject
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : subjects.length === 0 ? (
                                    <p className="text-gray-500">No Subjects Found</p>
                                ) : (
                                    subjects.map(sub => (
                                        <div
                                            key={sub._id}
                                            className="border rounded-xl p-4 hover:shadow"
                                        >
                                            {sub.subjectName}
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    )}

                </motion.div>
            </div>
        </div>
    );
}