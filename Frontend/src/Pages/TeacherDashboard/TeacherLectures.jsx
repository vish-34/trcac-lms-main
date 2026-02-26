import { motion } from "framer-motion";

export default function TeacherLectures() {

    const lectures = [

        {
            id: 1,
            topic: "IP Addressing",
            subject: "Computer Networks",
            date: "20 Feb",
            duration: "1 Hr",
            attendance: "87%"
        },

        {
            id: 2,
            topic: "Normalization",
            subject: "DBMS",
            date: "21 Feb",
            duration: "2 Hr",
            attendance: "90%"
        },

        {
            id: 3,
            topic: "Java OOP Concepts",
            subject: "Java",
            date: "22 Feb",
            duration: "1.5 Hr",
            attendance: "80%"
        }

    ];


    return (

        <div className="space-y-8">

            <h1 className="text-2xl font-semibold">

                Lectures Review

            </h1>


            {/* SUMMARY */}

            <div className="grid grid-cols-3 gap-5">

                <StatCard title="Total Lectures" value="36" color="bg-indigo-100" />

                <StatCard title="This Week" value="5 Done" color="bg-purple-100" />

                <StatCard title="Avg Attendance" value="85%" color="bg-green-100" />

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

                            <th className="p-4">Topic</th>

                            <th>Subject</th>

                            <th>Date</th>

                            <th>Duration</th>

                            <th>Attendance</th>

                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {lectures.map((l) => (

                            <tr key={l.id} className="border-t">

                                <td className="p-4 font-medium">

                                    {l.topic}

                                </td>

                                <td>

                                    {l.subject}

                                </td>

                                <td>

                                    {l.date}

                                </td>

                                <td>

                                    {l.duration}

                                </td>

                                <td>

                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">

                                        {l.attendance}

                                    </span>

                                </td>

                                <td>

                                    <button className="text-indigo-600">

                                        View Details

                                    </button>

                                </td>

                            </tr>

                        ))}

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