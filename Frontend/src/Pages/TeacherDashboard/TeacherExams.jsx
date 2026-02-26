import { useState } from "react";
import { motion } from "framer-motion";

export default function TeacherExams() {

    const [exams] = useState([

        {
            id: 1,
            title: "Computer Networks Mid Term",
            subject: "TYBSc CS",
            date: "28 Feb",
            attempted: 50,
            total: 60
        },

        {
            id: 2,
            title: "DBMS Unit Test",
            subject: "SYBSc CS",
            date: "5 March",
            attempted: 30,
            total: 50
        },

        {
            id: 3,
            title: "Java Practical",
            subject: "FYBSc CS",
            date: "20 Feb",
            attempted: 60,
            total: 60
        }

    ]);


    return (

        <div className="space-y-8">

            {/* HEADER */}

            <div className="flex justify-between items-center">

                <h1 className="text-2xl font-semibold">

                    Exams

                </h1>

                <button

                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"

                >

                    + Create Exam

                </button>

            </div>



            {/* SUMMARY */}

            <div className="grid grid-cols-3 gap-5">

                <StatCard title="Total Exams" value="9" color="bg-indigo-100" />

                <StatCard title="Upcoming" value="3 Scheduled" color="bg-yellow-100" />

                <StatCard title="Completed" value="6 Finished" color="bg-green-100" />

            </div>



            {/* TABLE */}

            <motion.div

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                className="bg-white rounded-xl shadow overflow-hidden"

            >

                <table className="w-full text-left">

                    <thead className="bg-gray-50">

                        <tr>

                            <th className="p-4">Exam</th>

                            <th>Subject</th>

                            <th>Date</th>

                            <th>Attempts</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {exams.map((e) => {

                            const completed = e.attempted === e.total;

                            return (

                                <tr key={e.id} className="border-t">

                                    <td className="p-4 font-medium">

                                        {e.title}

                                    </td>

                                    <td>{e.subject}</td>

                                    <td>{e.date}</td>

                                    <td>

                                        {e.attempted}/{e.total}

                                    </td>

                                    <td>

                                        <span

                                            className={`px-3 py-1 rounded-full text-sm

${completed ?

                                                    "bg-green-100 text-green-700"

                                                    :

                                                    "bg-yellow-100 text-yellow-700"

                                                }

`}

                                        >

                                            {completed ?

                                                "Completed"

                                                :

                                                "Scheduled"

                                            }

                                        </span>

                                    </td>


                                    <td className="space-x-3">

                                        <button className="text-indigo-600 font-medium">

                                            Results

                                        </button>

                                        <button className="text-gray-500">

                                            View

                                        </button>

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </motion.div>



        </div>

    );

}


function StatCard({ title, value, color }) {

    return (

        <div className={`${color} rounded-xl p-5`}>

            <p className="text-sm text-gray-600">

                {title}

            </p>

            <h2 className="text-xl font-semibold mt-2">

                {value}

            </h2>

        </div>

    );

}