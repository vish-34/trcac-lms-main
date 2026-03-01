import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SubjectSlider() {

  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const icon = <BookOpen className="w-6 h-6" />;

  // =================
  // DETERMINE AVAILABLE SEMESTERS
  // =================

  const getSemesterOptions = () => {
    if (!user || user.college !== "Degree College") return [];

    if (user.year === "FY") return [1, 2];
    if (user.year === "SY") return [3, 4];
    if (user.year === "TY") return [5, 6];

    return [];
  };

  const semesterOptions = getSemesterOptions();

  // Set default semester on load
  useEffect(() => {
    if (semesterOptions.length > 0) {
      setSelectedSemester(semesterOptions[0]);
    }
  }, [user]);

  // =================
  // FETCH SUBJECTS
  // =================

  useEffect(() => {

    const fetchSubjects = async () => {

      try {

        if (!user) return;

        let params = {};

        if (user.college === "Degree College") {

          if (!selectedSemester) return;

          params = {
            collegeType: "degree",
            year: user.year,
            semester: selectedSemester,
            courseOrStream: user.degree
          };

        } else {

          params = {
            collegeType: "junior",
            year: user.year,
            courseOrStream: user.stream
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
        console.log("Subject Fetch Error:", error);
      }

    };

    fetchSubjects();

  }, [user, selectedSemester]);

  const gradients = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-amber-400",
    "from-emerald-500 to-teal-400",
    "from-indigo-500 to-violet-500"
  ];

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">
          Curriculum
        </h2>
        <h1 className="text-4xl font-extrabold text-slate-900">
          Subjects
        </h1>
      </div>

      {/* SEMESTER TOGGLE */}
      {user?.college === "Degree College" && semesterOptions.length > 0 && (
        <div className="flex bg-gray-100 rounded-full p-1 w-fit mb-8">
          {semesterOptions.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-6 py-2 rounded-full text-sm transition ${
                selectedSemester === sem
                  ? "bg-white shadow font-medium"
                  : "text-gray-500"
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      )}

      {/* SUBJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {subjects.length === 0 ? (
          <p className="text-gray-500">
            No Subjects Available
          </p>
        ) : (
          subjects.map((sub, index) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden cursor-pointer"
            >
              <div
                className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br
                ${gradients[index % gradients.length]}
                opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}
              />

              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br
                ${gradients[index % gradients.length]}
                flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}
              >
                {icon}
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {sub.subjectName}
              </h3>

              <p className="text-slate-500 text-sm font-medium mb-6">
                Semester {sub.semester || "-"}
              </p>

              <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                <span>Explore Modules</span>
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>

            </motion.div>
          ))
        )}

      </div>

    </div>
  );
}