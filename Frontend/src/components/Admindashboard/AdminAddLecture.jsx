import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function AdminAddLecture() {

    const [form, setForm] = useState({

        title: "",
        subject: "",
        facultyName: "",
        youtubeLink: "",
        college: "",
        course: "",
        stream: "",
        degree: "",
        year: "",
        semester: ""

    });

    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    useEffect(() => {

        const fetchSubjects = async () => {

            try {

                if (!form.college || !form.year) {
                    setSubjects([]);
                    return;
                }

                let params = {};

                if (form.college === "Degree College") {

                    if (!form.degree || !form.semester) {
                        setSubjects([]);
                        return;
                    }

                    params = {
                        collegeType: "degree",
                        year: form.year,
                        semester: form.semester,
                        courseOrStream: form.degree
                    };

                }

                else if (form.college === "Junior College") {

                    if (!form.stream) {
                        setSubjects([]);
                        return;
                    }

                    params = {
                        collegeType: "junior",
                        year: form.year,
                        courseOrStream: form.stream
                    };

                }

                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/subjects/get-subjects`,
                    { params }
                );

                if (res.data.success) {
                    setSubjects(res.data.subjects);
                }

            } catch (error) {
                console.log("Error fetching subjects:", error);
            }

        };

        fetchSubjects();

    }, [form.college, form.year, form.degree, form.stream, form.semester]);


    // HANDLE CHANGE

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((prev) => {

            const updated = { ...prev, [name]: value };

            if (
                name === "college" ||
                name === "year" ||
                name === "degree" ||
                name === "stream"
            ) {
                updated.subject = "";
            }

            // Reset semester when year changes
            if (name === "year") {
                updated.semester = "";
            }

            return updated;
        });

    };


    // SUBMIT

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        try {

            console.log('Submitting form data:', form);

            // Only send relevant fields based on college type
            const submissionData = {
                title: form.title,
                subject: form.subject,
                facultyName: form.facultyName,
                youtubeLink: form.youtubeLink,
                college: form.college,
                course: form.course,
                year: form.year
            };

            // Add college-specific fields
            if (form.college === 'Junior College') {
                submissionData.stream = form.stream;
            } else if (form.college === 'Degree College') {
                submissionData.degree = form.degree;
                submissionData.semester = form.semester;
            }

            // Explicitly remove stream for Degree College
            if (form.college === 'Degree College') {
                delete submissionData.stream;
            }

            console.log('Cleaned submission data:', submissionData);

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/lecture/add`,

                submissionData

            );

            setMessage("Lecture Added Successfully ✅");


            setForm({

                title: "",
                subject: "",
                facultyName: "",
                youtubeLink: "",
                college: "",
                course: "",
                degree: "",
                year: "",
                semester: ""

            });

        }
        catch (error) {

            console.error('Error adding lecture:', error.response?.data || error.message);

            setMessage(`Error adding lecture: ${error.response?.data?.message || 'Unknown error'} ❌`);

        }
        finally {

            setLoading(false);

        }

    };



    return (

        <div className="space-y-8">

            {/* HEADER */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center"
            >

                <div>

                    <h1 className="text-2xl font-semibold">

                        Add Lecture

                    </h1>

                    <p className="text-gray-500">

                        Upload lectures for student dashboard

                    </p>

                </div>

            </motion.div>



            {/* CARD */}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow p-8 space-y-6"
            >

                {message && (

                    <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg">

                        {message}

                    </div>

                )}


                <form
                    onSubmit={handleSubmit}
                    className="grid md:grid-cols-2 gap-6"
                >


                    {/* COLLEGE FIRST */}

                    <div>

                        <label className="text-sm text-gray-600">

                            College

                        </label>

                        <select

                            name="college"
                            required
                            value={form.college}
                            onChange={handleChange}

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        >

                            <option value="">

                                Select College

                            </option>

                            <option value="Degree College">

                                Degree College

                            </option>

                            <option value="Junior College">

                                Junior College

                            </option>

                        </select>

                    </div>



                    {/* YEAR */}

                    {form.college && (

                        <div>

                            <label className="text-sm text-gray-600">

                                Year

                            </label>

                            <select

                                name="year"
                                required
                                value={form.year}
                                onChange={handleChange}

                                className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                            >

                                <option value="">

                                    Select Year

                                </option>

                                {form.college === "Junior College" ? (

                                    <>

                                        <option value="FYJC">

                                            FYJC

                                        </option>

                                        <option value="SYJC">

                                            SYJC

                                        </option>

                                    </>

                                )

                                    :

                                    (

                                        <>

                                            <option value="FY">

                                                First Year (FY)

                                            </option>

                                            <option value="SY">

                                                Second Year (SY)

                                            </option>

                                            <option value="TY">

                                                Third Year (TY)

                                            </option>

                                        </>

                                    )

                                }

                            </select>

                        </div>

                    )}



                    {/* STREAM */}

                    {form.college === "Junior College" && (

                        <div>

                            <label className="text-sm text-gray-600">

                                Stream

                            </label>

                            <select

                                name="stream"
                                required
                                value={form.stream}
                                onChange={handleChange}

                                className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                            >

                                <option value="">

                                    Select Stream

                                </option>

                                <option value="Commerce">

                                    Commerce

                                </option>

                                <option value="Arts">

                                    Arts

                                </option>

                            </select>

                        </div>

                    )}



                    {/* DEGREE */}

                    {form.college === "Degree College" && (

                        <div>

                            <label className="text-sm text-gray-600">

                                Degree

                            </label>

                            <select

                                name="degree"
                                required
                                value={form.degree}
                                onChange={handleChange}

                                className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                            >

                                <option value="">

                                    Select Degree

                                </option>

                                <option value="B.Sc (CS)">

                                    B.Sc (CS)

                                </option>

                                <option value="B.Sc (IT)">

                                    B.Sc (IT)

                                </option>

                                <option value="BA">

                                    BA

                                </option>

                                <option value="BAMMC">

                                    BAMMC

                                </option>

                                <option value="BCom">

                                    BCom

                                </option>

                                <option value="BMS">

                                    BMS

                                </option>

                                <option value="BAF">

                                    BAF

                                </option>

                            </select>

                        </div>

                    )}

                     {/* SEMESTER */}

                    {form.college === "Degree College" && form.year && (

                        <div>
                            <label className="text-sm text-gray-600">
                                Semester
                            </label>

                            <select
                                name="semester"
                                required
                                value={form.semester}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"
                            >

                                <option value="">
                                    Select Semester
                                </option>

                                {form.year === "FY" && (
                                    <>
                                        <option value="1">Semester 1</option>
                                        <option value="2">Semester 2</option>
                                    </>
                                )}

                                {form.year === "SY" && (
                                    <>
                                        <option value="3">Semester 3</option>
                                        <option value="4">Semester 4</option>
                                    </>
                                )}

                                {form.year === "TY" && (
                                    <>
                                        <option value="5">Semester 5</option>
                                        <option value="6">Semester 6</option>
                                    </>
                                )}

                            </select>
                        </div>

                    )}




                    {/* SUBJECT AFTER FILTERS */}

                    <div>

                        <label className="text-sm text-gray-600">

                            Subject

                        </label>

                        <select

                            name="subject"
                            required
                            value={form.subject}
                            onChange={handleChange}

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

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

                    </div>



                    {/* TITLE */}

                    <div>

                        <label className="text-sm text-gray-600">

                            Lecture Title

                        </label>

                        <input

                            name="title"
                            required
                            value={form.title}
                            onChange={handleChange}

                            placeholder="IP Addressing Basics"

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        />

                    </div>



                    {/* FACULTY */}

                    <div>

                        <label className="text-sm text-gray-600">

                            Faculty Name

                        </label>

                        <input

                            name="facultyName"
                            required
                            value={form.facultyName}
                            onChange={handleChange}

                            placeholder="Prof Sharma"

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        />

                    </div>



                   


                    {/* YOUTUBE */}

                    <div className="md:col-span-2">

                        <label className="text-sm text-gray-600">

                            Youtube Lecture Link

                        </label>

                        <input

                            name="youtubeLink"
                            required
                            value={form.youtubeLink}
                            onChange={handleChange}

                            placeholder="https://youtube.com/watch?v=..."

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        />

                    </div>



                    {/* BUTTON */}

                    <div className="md:col-span-2 flex justify-end">

                        <button

                            type="submit"
                            disabled={loading}

                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium"

                        >

                            {loading ?

                                "Uploading..."

                                :

                                "Add Lecture"

                            }

                        </button>

                    </div>

                </form>

            </motion.div>

        </div>

    )
};