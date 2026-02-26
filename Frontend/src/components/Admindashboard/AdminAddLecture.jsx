import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function AdminAddLecture() {

    const [form, setForm] = useState({

        title: "",
        className: "",
        subject: "",
        facultyName: "",   // ✅ NEW
        youtubeLink: ""

    });

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");


    // HANDLE CHANGE

    const handleChange = (e) => {

        setForm({

            ...form,
            [e.target.name]: e.target.value

        });

    };


    // SUBMIT

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        try {

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/lecture/add`,

                form

            );

            setMessage("Lecture Added Successfully ✅");


            setForm({

                title: "",
                className: "",
                subject: "",
                facultyName: "",
                youtubeLink: ""

            });

        }
        catch (error) {

            console.log(error);

            setMessage("Error adding lecture ❌");

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



                    {/* SUBJECT */}

                    <div>

                        <label className="text-sm text-gray-600">

                            Subject

                        </label>

                        <input

                            name="subject"

                            required

                            value={form.subject}

                            onChange={handleChange}

                            placeholder="Computer Networks"

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        />

                    </div>



                    {/* FACULTY NAME */}

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



                    {/* CLASS */}

                    <div>

                        <label className="text-sm text-gray-600">

                            Class

                        </label>

                        <select

                            name="className"

                            required

                            value={form.className}

                            onChange={handleChange}

                            className="w-full border rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-indigo-400"

                        >

                            <option value="">

                                Select Class

                            </option>

                            <option>BScCSFY</option>

                            <option>BScCSSY</option>

                            <option>BScCSTY</option>

                        </select>

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

                            {loading ? "Uploading..." : "Add Lecture"}

                        </button>

                    </div>

                </form>

            </motion.div>

        </div>

    );

}