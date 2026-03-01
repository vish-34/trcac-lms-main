import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminCredentials() {
  const [activeTab, setActiveTab] = useState("teacher");
  const [studentSubTab, setStudentSubTab] = useState("degree");
  const [teachers, setTeachers] = useState([]);
  const [degreeStudents, setDegreeStudents] = useState([]);
  const [juniorStudents, setJuniorStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { token } = useAuth();

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchUsers();
  }, [activeTab, studentSubTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        activeTab === "teacher"
          ? `${import.meta.env.VITE_API_URL}/api/admin/teachers`
          : `${import.meta.env.VITE_API_URL}/api/admin/students`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ${activeTab}s`);
      }

      const data = await res.json();

      if (activeTab === "teacher") {
        setTeachers(data.teachers || []);
      } else {
        // Split students by college type
        const allStudents = data.students || [];
        setDegreeStudents(allStudents.filter(s => s.college === "Degree College"));
        setJuniorStudents(allStudents.filter(s => s.college === "Junior College"));
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTERING ---------------- */
  const filterUsers = (users) =>
    users.filter((u) => {
      const term = searchTerm.toLowerCase();

      return (
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.degree?.toLowerCase().includes(term) ||
        u.course?.toLowerCase().includes(term) ||
        u.subject?.toLowerCase().includes(term)
      );
    });

  const currentData =
    activeTab === "teacher"
      ? filterUsers(teachers)
      : studentSubTab === "degree"
      ? filterUsers(degreeStudents)
      : filterUsers(juniorStudents);

  const totalCount =
    activeTab === "teacher" 
      ? teachers.length 
      : studentSubTab === "degree"
      ? degreeStudents.length
      : juniorStudents.length;

  /* ---------------- ACTIONS ---------------- */
  const handleEdit = (user) => {
    console.log("Edit user:", user);
  };

  const handleRemove = async (userId) => {
    try {
      const endpoint =
        activeTab === "teacher"
          ? `${import.meta.env.VITE_API_URL}/api/admin/teachers/${userId}`
          : `${import.meta.env.VITE_API_URL}/api/admin/students/${userId}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("Delete failed");

      if (activeTab === "teacher") {
        setTeachers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        if (studentSubTab === "degree") {
          setDegreeStudents((prev) => prev.filter((u) => u._id !== userId));
        } else {
          setJuniorStudents((prev) => prev.filter((u) => u._id !== userId));
        }
      }
    } catch (err) {
      alert("Failed to remove user");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Credentials Management</h1>
        {/* <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">
          + Add {activeTab === "teacher" ? "Teacher" : "Student"}
        </button> */}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-5">
        <StatCard
          title={`Total ${activeTab === "teacher" ? "Teachers" : "Students"}`}
          value={totalCount}
          color="bg-indigo-100"
        />
        <StatCard
          title="Visible Results"
          value={currentData.length}
          color="bg-purple-100"
        />
      </div>

      {/* TABS */}
      <div className="flex bg-gray-100 rounded-full p-1 w-[350px]">
        {["teacher", "student"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-1/2 py-2 rounded-full transition ${
              activeTab === tab
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
          </button>
        ))}
      </div>

      {/* STUDENT SUBTABS */}
      {activeTab === "student" && (
        <div className="flex bg-gray-100 rounded-full p-1 w-[400px]">
          {["degree", "junior"].map((subTab) => (
            <button
              key={subTab}
              onClick={() => setStudentSubTab(subTab)}
              className={`w-1/2 py-2 rounded-full transition ${
                studentSubTab === subTab
                  ? "bg-white shadow font-medium"
                  : "text-gray-500"
              }`}
            >
              {subTab === "degree" ? "Degree College" : "Junior College"}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH */}
      <input
        type="text"
        placeholder={`Search ${activeTab}s...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-indigo-400"
      />

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow overflow-hidden"
      >
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{error}</div>
        ) : currentData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Full Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">
                {activeTab === "student" && studentSubTab === "junior" ? "Stream" : "Course / Degree"}
              </th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((user) => (
                <tr key={user._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{user.fullName}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    {activeTab === "student" && studentSubTab === "junior"
                      ? user.stream || "—"
                      : user.course || user.subject || user.degree || "—"
                    }
                  </td>
                  <td className="p-4 space-x-3">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(user._id)}
                      className="text-red-500 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}

/* ---------------- STATS CARD ---------------- */
function StatCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-xl p-5`}>
      <p className="text-sm text-gray-600">{title}</p>
      <h2 className="text-xl font-semibold mt-2">{value}</h2>
    </div>
  );
}