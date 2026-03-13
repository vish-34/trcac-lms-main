import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Quiz Results
          </h1>

          <button
            type="button"
            onClick={() => navigate("/teacherdashboard")}
            className="w-full sm:w-auto text-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading && (
            <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">
              Loading results...
            </div>
          )}

          {!loading && error && (
            <div className="p-6 sm:p-10 text-center text-red-500 text-sm sm:text-base">
              {error}
            </div>
          )}

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

          {!loading && !error && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-xs sm:text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] sm:text-xs tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Student</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Roll No</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Email</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Score</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">Submitted</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-800 whitespace-nowrap">
                        {result.studentName || result.studentId?.fullName || "-"}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                        {result.studentRollNo || result.studentId?.rollNo || "-"}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 break-all">
                        {result.studentEmail || result.studentId?.email || "-"}
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] sm:text-xs font-semibold">
                          {result.score} / {result.totalQuestions}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 whitespace-nowrap">
                        {result.submittedAt
                          ? new Date(result.submittedAt).toLocaleString()
                          : "-"}
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
