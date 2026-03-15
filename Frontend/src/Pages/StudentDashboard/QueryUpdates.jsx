import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import queryService from "../../services/queryService.js";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

export default function QueryUpdates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUpdates = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await queryService.getStudentQueryUpdates(user.id);
        setUpdates(data);
      } catch (fetchError) {
        console.error("Error loading query updates:", fetchError);
        setError("Unable to load query updates right now.");
      } finally {
        setLoading(false);
      }
    };

    loadUpdates();
  }, [user]);

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-8 pt-14 md:pt-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Query Updates</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track teacher replies and open any lecture query thread from here.
          </p>
        </div>
        <button
          onClick={() => navigate("/studentdashboard/lectures")}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Ask New Query
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-6 text-gray-500">Loading query updates...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      ) : updates.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900">No query updates yet</h2>
          <p className="text-sm text-gray-500 mt-2">
            Ask a question from any lecture and teacher replies will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{item.lectureTitle}</h2>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : item.status === "answered"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {item.lectureSubject} • {item.teacherName}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Question:</span> {item.question}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated on {formatDate(item.updatedAt)}
                  </p>
                  {item.answer ? (
                    <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <span className="font-medium">Answer:</span> {item.answer}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Waiting for teacher response.
                    </p>
                  )}
                </div>

                <div className="sm:self-center">
                  <button
                    onClick={() =>
                      navigate(`/queries?lectureId=${item.lectureId}`, {
                        state: {
                          lecture: {
                            _id: item.lectureId,
                            title: item.lectureTitle,
                            subject: item.lectureSubject,
                            facultyName: item.teacherName,
                          },
                        },
                      })
                    }
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Open Thread
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
