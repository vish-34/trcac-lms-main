import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function QuizResults() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/quiz-results/${examId}`
        );
        setResults(res.data);
      } catch (err) {
        setError("Failed to load quiz results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Quiz Results
          </h1>

          <Link
            to="/teacherdashboard"
            className="w-full sm:w-auto text-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Loading */}
          {loading && (
            <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">
              Loading results...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-6 sm:p-10 text-center text-red-500 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="p-6 sm:p-10 text-center">
              <div className="text-gray-400 text-base sm:text-lg mb-2">
                No attempts yet
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Students haven't submitted this quiz.
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs sm:text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] sm:text-xs tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Student</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Email</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Score</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Submitted</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-800 whitespace-nowrap">
                        {r.studentId?.fullName || "—"}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 break-all">
                        {r.studentId?.email || "—"}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] sm:text-xs font-semibold">
                          {r.score} / {r.totalQuestions}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}