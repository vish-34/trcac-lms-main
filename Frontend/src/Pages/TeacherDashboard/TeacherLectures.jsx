import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TeacherLectures() {

  const { user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch teacher's lectures
  useEffect(() => {
    const fetchTeacherLectures = async () => {
      try {
        console.log('📚 Fetching lectures for teacher:', user?.fullName);
        
        if (!user || !user.fullName) {
          console.log('❌ No user or fullName found, skipping fetch');
          setLectures([]);
          return;
        }

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/lecture/teacher/${user.fullName}`
        );

        console.log('✅ Teacher lectures API response:', {
          status: res.status,
          dataLength: res.data?.length || 0,
          dataType: typeof res.data
        });
        
        // Log each lecture found
        if (res.data && Array.isArray(res.data)) {
          console.log('📋 Lectures found for', user.fullName, ':');
          res.data.forEach((lecture, index) => {
            console.log(`   ${index + 1}. ${lecture.title} (${lecture.subject}) - ID: ${lecture._id}`);
          });
        }
        
        setLectures(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching teacher lectures:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        
        // Set appropriate error message
        if (err.response?.status === 404) {
          console.log('ℹ️  No lectures found for teacher:', user?.fullName);
        } else if (err.response?.status === 500) {
          console.error('💥 Server error occurred');
        }
        
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherLectures();
  }, [user]);

  return (

    <div className="space-y-8 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <h1 className="text-xl sm:text-2xl font-semibold">

          My Lectures

        </h1>

      </div>


      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <StatCard
          title="Total Lectures"
          value={lectures.length.toString()}
          color="bg-indigo-100"
        />

        <StatCard
          title="This Week"
          value="5 Done"
          color="bg-purple-100"
        />

        <StatCard
          title="Avg Attendance"
          value="85%"
          color="bg-green-100"
        />

      </div>



      {/* TABLE */}

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="bg-white rounded-xl shadow overflow-hidden"

      >

        {/* scroll wrapper */}

        <div className="overflow-x-auto">

          <table className="min-w-[700px] w-full text-left text-sm">

            <thead className="bg-gray-50 text-gray-600">

              <tr>

                <th className="p-4">Topic</th>

                <th>Subject</th>

                <th>Date</th>

                <th>Duration</th>

                <th>Attendance</th>

                <th className="pr-4">Action</th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading lectures...
                  </td>
                </tr>
              ) : lectures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <div className="space-y-2">
                      <p className="text-lg font-medium">No lectures assigned to you yet</p>
                      <p className="text-sm">Contact your admin to get lectures assigned to your name</p>
                    </div>
                  </td>
                </tr>
              ) : (
                lectures.map((l) => (
                  <tr
                    key={l._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium break-words">
                      {l.title}
                    </td>
                    <td>
                      {l.subject}
                    </td>
                    <td>
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      -
                    </td>
                    <td>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                        N/A
                      </span>
                    </td>
                    <td className="pr-4">
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </motion.div>

    </div>

  );





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
}