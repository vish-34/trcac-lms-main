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
    const [verticals, setVerticals] = useState([1, 2, 3, 4, 5, 6]);

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

            console.log('API Parameters:', params);
            console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`,
                { params }
            );

            console.log('API Response:', response.data);
            console.log('API Response success:', response.data.success);
            console.log('API Response subjects:', response.data.subjects);
            console.log('API Response message:', response.data.message);

            if (response.data.success) {
                setSubjects(response.data.subjects);
            } else {
                console.log('API returned error:', response.data.message);
            }

        } catch (err) {
            console.log('API Error:', err);
            console.log('Error response:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [mode, degreeYear, semester, course, jcYear, stream]);

    // Group subjects by semester, then by vertical
    const groupedBySemester = subjects.reduce((acc, subject) => {
        // Handle semester as both string and number
        const semester = String(subject.semester || '');
        if (!semester) {
            console.log('Subject missing semester:', subject);
            return acc; // Skip subjects without semester
        }
        
        if (!acc[semester]) acc[semester] = {};
        
        // Handle vertical - if missing, assign based on subject type or create groups
        let verticalKey;
        if (subject.vertical) {
            verticalKey = String(subject.vertical);
        } else {
            // Organize subjects without vertical by subject type/pattern
            const subjectName = subject.subjectName || '';
            if (subjectName.includes('Major') || subjectName.includes('Practical')) {
                verticalKey = '1'; // Core subjects
            } else if (subjectName.includes('VSC') || subjectName.includes('SEC')) {
                verticalKey = '2'; // Skill courses
            } else if (subjectName.includes('OE')) {
                verticalKey = '3'; // Open electives
            } else if (subjectName.includes('AEC') || subjectName.includes('VEC')) {
                verticalKey = '4'; // Ability enhancement courses
            } else if (subjectName.includes('CC')) {
                verticalKey = '5'; // Common courses
            } else {
                verticalKey = '6'; // Others
            }
        }
        
        if (!acc[semester][verticalKey]) acc[semester][verticalKey] = [];
        
        acc[semester][verticalKey].push(subject);
        return acc;
    }, {});

    // Get vertical title based on vertical key
    const getVerticalTitle = (verticalKey) => {
        const titles = {
            '1': 'Vertical 1',
            '2': 'Vertical 2',
            '3': 'Vertical 3',
            '4': 'Vertical 4',
            '5': 'Vertical 5',
            '6': 'Vertical 6',
            '7': 'Other Subjects'
        };
        return titles[verticalKey] || `Vertical ${verticalKey}`;
    };

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

                            {loading ? (
                                <p>Loading...</p>
                            ) : subjects.length === 0 ? (
                                <p className="text-gray-500">No Subjects Found</p>
                            ) : (
                                <div className="space-y-8">
                                    {Object.keys(groupedBySemester)
                                        .sort((a, b) => a - b)   // sort semesters numerically
                                        .map(semester => (
                                            <div key={semester} className="border-2 border-indigo-200 rounded-xl p-6">
                                                {/* Semester Title */}
                                                <h3 className="text-xl font-bold text-indigo-800 mb-6 pb-3 border-b border-indigo-200">
                                                    Semester {semester}
                                                </h3>

                                                {/* Verticals under semester */}
                                                <div className="space-y-6">
                                                    {Object.keys(groupedBySemester[semester])
                                                        .sort((a, b) => a - b)   // sort verticals numerically
                                                        .map(vertical => (
                                                            <div key={vertical} className="border rounded-xl p-4 bg-gray-50">
                                                                {/* Vertical Title */}
                                                                <h4 className="font-semibold text-lg mb-4 text-indigo-700">
                                                                    {getVerticalTitle(vertical)}
                                                                </h4>

                                                                {/* Subjects under vertical */}
                                                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                                    {groupedBySemester[semester][vertical].map(sub => (
                                                                        <div
                                                                            key={sub._id}
                                                                            className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:shadow transition-shadow"
                                                                        >
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-start justify-between">
                                                                                    <h5 className="font-semibold text-gray-800 text-sm leading-tight">
                                                                                        {sub.subjectName}
                                                                                    </h5>
                                                                                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-mono">
                                                                                        {sub.subjectCode}
                                                                                    </span>
                                                                                </div>
                                                                                {sub.courseCredits && (
                                                                                    <div className="flex items-center text-xs text-gray-600">
                                                                                        <span className="bg-gray-200 px-2 py-1 rounded">
                                                                                            {sub.courseCredits} Credits
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
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
                                            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow transition-shadow"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                                                        {sub.subjectName}
                                                    </h4>
                                                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-mono">
                                                        {sub.subjectCode}
                                                    </span>
                                                </div>
                                                {sub.courseCredits && (
                                                    <div className="flex items-center text-xs text-gray-600">
                                                        <span className="bg-gray-200 px-2 py-1 rounded">
                                                            {sub.courseCredits} Credits
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
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