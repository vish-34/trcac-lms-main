// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import axios from "axios";
// import { useAuth } from "../../context/AuthContext.jsx";

// export default function Exams() {

//   const { user } = useAuth();

//   const [exams, setExams] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [stats, setStats] = useState({
//     total: 0,
//     upcoming: 0,
//     completed: 0
//   });

//   /* ================= FETCH EXAMS ================= */

//   useEffect(() => {
//     fetchStudentExams();
//   }, [user]);

//   const fetchStudentExams = async () => {

//     try {

//       setLoading(true);

//       // 👇 Backend should filter using student data
//       const res = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/exams/student/${user?.id}`
//       );

//       const examsData = res.data.exams || [];

//       setExams(examsData);

//       const now = new Date();

//       const total = examsData.length;

//       const upcoming = examsData.filter(
//         exam => new Date(exam.examDate) > now
//       ).length;

//       const completed = examsData.filter(
//         exam => new Date(exam.examDate) <= now
//       ).length;

//       setStats({
//         total,
//         upcoming,
//         completed
//       });

//     } catch (err) {

//       console.error(err);
//       setError("Failed to fetch exams");

//     } finally {

//       setLoading(false);

//     }

//   };

//   /* ================= HELPERS ================= */

//   const formatDateTime = (dateString) => {

//     const date = new Date(dateString);

//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit"
//     });

//   };

//   const getExamStatus = (examDate) => {

//     const now = new Date();
//     const exam = new Date(examDate);

//     if (exam <= now) {

//       return {
//         status: "Completed",
//         color: "bg-green-100 text-green-700"
//       };

//     }

//     return {
//       status: "Upcoming",
//       color: "bg-yellow-100 text-yellow-700"
//     };

//   };

//   const getExamTypeColor = (examType) => {

//     switch (examType) {

//       case "midterm":
//         return "bg-blue-100 text-blue-800";

//       case "final":
//         return "bg-red-100 text-red-800";

//       case "quiz":
//         return "bg-green-100 text-green-800";

//       case "practical":
//         return "bg-purple-100 text-purple-800";

//       case "assignment":
//         return "bg-yellow-100 text-yellow-800";

//       default:
//         return "bg-gray-100 text-gray-800";
//     }

//   };

//   /* ================= UI ================= */

//   return (

//     <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">

//       {/* HEADER */}

//       <div className="flex justify-between items-center">

//         <h1 className="text-xl sm:text-2xl font-semibold">

//           My Exams

//         </h1>

//       </div>

//       {/* STATS */}

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

//         <StatCard
//           title="Total Exams"
//           value={stats.total}
//           color="bg-indigo-100"
//         />

//         <StatCard
//           title="Upcoming"
//           value={`${stats.upcoming} Scheduled`}
//           color="bg-yellow-100"
//         />

//         <StatCard
//           title="Completed"
//           value={`${stats.completed} Finished`}
//           color="bg-green-100"
//         />

//       </div>

//       {/* ERROR */}

//       {error && (

//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">

//           {error}

//         </div>

//       )}

//       {/* TABLE */}

//       <motion.div

//         initial={{ opacity: 0, y: 20 }}

//         animate={{ opacity: 1, y: 0 }}

//         className="bg-white rounded-xl shadow overflow-hidden"

//       >

//         {loading ? (

//           <div className="p-8">

//             <div className="animate-pulse space-y-4">

//               {[1, 2, 3].map(i => (

//                 <div
//                   key={i}
//                   className="h-12 bg-gray-200 rounded"
//                 />

//               ))}

//             </div>

//           </div>

//         ) : exams.length === 0 ? (

//           <div className="text-center py-12">

//             <h3 className="font-medium">

//               No Exams Available

//             </h3>

//             <p className="text-sm text-gray-500 mt-1">

//               Your teacher hasn’t scheduled exams yet.

//             </p>

//           </div>

//         ) : (

//           <div className="overflow-x-auto">

//             <table className="min-w-[900px] w-full text-left text-sm">

//               <thead className="bg-gray-50 text-gray-600">

//                 <tr>

//                   <th className="p-4">Exam</th>

//                   <th>Subject</th>

//                   <th>Date & Time</th>

//                   <th>Duration</th>

//                   <th>Type</th>

//                   <th>Status</th>

//                   <th className="pr-4">Paper</th>

//                 </tr>

//               </thead>

//               <tbody>

//                 {exams.map(exam => {

//                   const examStatus =
//                     getExamStatus(exam.examDate);

//                   return (

//                     <tr
//                       key={exam._id}
//                       className="border-t hover:bg-gray-50"
//                     >

//                       {/* TITLE */}

//                       <td className="p-4">

//                         <div className="font-medium">

//                           {exam.title}

//                         </div>

//                         {exam.instructions && (

//                           <div className="text-xs text-gray-500 mt-1 line-clamp-1">

//                             {exam.instructions}

//                           </div>

//                         )}

//                       </td>

//                       {/* SUBJECT */}

//                       <td>

//                         <div>

//                           {exam.subject}

//                         </div>

//                         <div className="text-xs text-gray-500">

//                           {exam.class}

//                         </div>

//                       </td>

//                       <td>

//                         {formatDateTime(exam.examDate)}

//                       </td>

//                       <td>

//                         {exam.duration} min

//                       </td>

//                       {/* TYPE */}

//                       <td>

//                         <span
//                           className={`text-xs px-2 py-1 rounded-full ${getExamTypeColor(
//                             exam.examType
//                           )}`}
//                         >

//                           {exam.examType}

//                         </span>

//                       </td>

//                       {/* STATUS */}

//                       <td>

//                         <span
//                           className={`px-3 py-1 rounded-full text-xs ${examStatus.color}`}
//                         >

//                           {examStatus.status}

//                         </span>

//                       </td>

//                       {/* VIEW */}

//                       <td className="pr-4">

//                         {exam.fileUrl ? (

//                           <a

//                             href={`${import.meta.env.VITE_API_URL}${exam.fileUrl}`}

//                             target="_blank"

//                             rel="noopener noreferrer"

//                             className="text-indigo-600 hover:text-indigo-800 font-medium"

//                           >

//                             View Paper

//                           </a>

//                         ) : (

//                           <span className="text-gray-400 text-xs">

//                             No File

//                           </span>

//                         )}

//                       </td>

//                     </tr>

//                   );

//                 })}

//               </tbody>

//             </table>

//           </div>

//         )}

//       </motion.div>

//     </div>

//   );

// }

// /* ================= STAT CARD ================= */

// function StatCard({ title, value, color }) {

//   return (

//     <div className={`${color} rounded-xl p-5`}>

//       <p className="text-sm text-gray-600">

//         {title}

//       </p>

//       <h2 className="text-xl font-semibold mt-2">

//         {value}

//       </h2>

//     </div>

//   );

// }