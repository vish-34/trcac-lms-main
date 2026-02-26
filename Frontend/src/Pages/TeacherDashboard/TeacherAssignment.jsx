import { useState } from "react";
import { motion } from "framer-motion";

export default function TeacherAssignment() {

    const [assignments] = useState([

        {
            id: 1,
            title: "DBMS Assignment 3",
            subject: "TYBSc CS",
            deadline: "28 Feb",
            submitted: 45,
            total: 60
        },

        {
            id: 2,
            title: "Computer Networks Practical",
            subject: "SYBSc CS",
            deadline: "1 March",
            submitted: 30,
            total: 50
        },

        {
            id: 3,
            title: "Java Programming",
            subject: "FYBSc CS",
            deadline: "5 March",
            submitted: 60,
            total: 60
        }

    ]);


    return (

        <div className="space-y-8">

            {/* HEADER */}

            <div className="flex justify-between items-center">

                <h1 className="text-2xl font-semibold">

                    Assignments

                </h1>


                <button

                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"

                >

                    + Add Assignment

                </button>

            </div>



            {/* SUMMARY CARDS */}

            <div className="grid grid-cols-3 gap-5">

                <StatCard
                    title="Total Assignments"
                    value="12"
                    color="bg-indigo-100"
                />

                <StatCard
                    title="Pending Review"
                    value="23 Submissions"
                    color="bg-yellow-100"
                />

                <StatCard
                    title="Completed"
                    value="8 Closed"
                    color="bg-green-100"
                />

            </div>



            {/* ASSIGNMENT TABLE */}

            <motion.div

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                className="bg-white rounded-xl shadow overflow-hidden"

            >

                <table className="w-full text-left">

                    <thead className="bg-gray-50">

                        <tr>

                            <th className="p-4">Assignment</th>

                            <th>Subject</th>

                            <th>Deadline</th>

                            <th>Submissions</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>


                    <tbody>

                        {assignments.map((a) => {

                            const completed = a.submitted === a.total;

                            return (

                                <tr

                                    key={a.id}

                                    className="border-t"

                                >

                                    <td className="p-4 font-medium">

                                        {a.title}

                                    </td>

                                    <td>

                                        {a.subject}

                                    </td>

                                    <td>

                                        {a.deadline}

                                    </td>


                                    {/* SUBMISSION */}

                                    <td>

                                        {a.submitted}/{a.total}

                                    </td>


                                    {/* STATUS */}

                                    <td>

                                        <span

                                            className={`px-3 py-1 rounded-full text-sm

${completed

                                                    ?

                                                    "bg-green-100 text-green-700"

                                                    :

                                                    "bg-yellow-100 text-yellow-700"

                                                }

`}

                                        >

                                            {completed ?

                                                "Completed"

                                                :

                                                "Pending"

                                            }

                                        </span>

                                    </td>



                                    {/* ACTIONS */}

                                    <td className="space-x-2">

                                        <button className="text-indigo-600 font-medium">

                                            Review

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



            {/* RECENT SUBMISSIONS */}

            <div>

                <h2 className="text-xl font-semibold mb-4">

                    Recent Student Submissions

                </h2>

                <div className="bg-white rounded-xl shadow p-6 space-y-3">

                    <ActivityCard

                        student="Rahul Sharma"

                        assignment="DBMS Assignment"

                        time="10 mins ago"

                    />

                    <ActivityCard

                        student="Sneha"

                        assignment="CN Practical"

                        time="1 hour ago"

                    />

                    <ActivityCard

                        student="Akash"

                        assignment="Java Assignment"

                        time="Today"

                    />

                </div>

            </div>


        </div>

    );

}



/* ---------- STAT CARD ---------- */

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



/* ---------- ACTIVITY ---------- */

function ActivityCard({ student, assignment, time }) {

    return (

        <div className="flex justify-between border-b pb-2">

            <div>

                <p className="font-medium">

                    {student}

                </p>

                <p className="text-sm text-gray-500">

                    Submitted {assignment}

                </p>

            </div>

            <p className="text-sm text-gray-400">

                {time}

            </p>

        </div>

    );

}