import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import queryService from "../services/queryService.js";

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleString();
};

const LectureQueries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const lectureId = searchParams.get("lectureId");
  const passedLecture = location.state?.lecture || null;

  const [lecture, setLecture] = useState(passedLecture);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLecture = async () => {
      if (!lectureId || lecture) return;

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/lecture/${lectureId}`);
        setLecture(response.data);
      } catch (fetchError) {
        console.error("Error fetching lecture details:", fetchError);
      }
    };

    fetchLecture();
  }, [lectureId, lecture]);

  const loadQueries = async () => {
    if (!lectureId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await queryService.getLectureQueries({
        lectureId,
        role: user.role,
        studentId: user.role === "student" ? user.id : undefined,
        teacherName: user.role === "teacher" ? user.fullName : undefined,
      });
      setQueries(data);
    } catch (fetchError) {
      console.error("Error loading lecture queries:", fetchError);
      setError("Unable to load lecture queries right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [lectureId, user]);

  const handleSubmitQuestion = async (event) => {
    event.preventDefault();

    if (!question.trim() || !lectureId) return;

    try {
      setSubmitting(true);
      await queryService.createQuery({
        lectureId,
        studentId: user.id,
        studentName: user.fullName || user.email,
        studentEmail: user.email,
        studentRollNo: user.rollNo || "",
        question: question.trim(),
      });
      setQuestion("");
      await loadQueries();
    } catch (submitError) {
      console.error("Error creating query:", submitError);
      setError("Unable to submit your query.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (queryId) => {
    const answer = answerDrafts[queryId]?.trim();
    if (!answer) return;

    try {
      setSubmitting(true);
      await queryService.answerQuery(queryId, {
        answer,
        teacherName: user.fullName || user.email,
      });
      setAnswerDrafts((prev) => ({ ...prev, [queryId]: "" }));
      await loadQueries();
    } catch (submitError) {
      console.error("Error answering query:", submitError);
      setError("Unable to submit the answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (queryId) => {
    try {
      setSubmitting(true);
      await queryService.resolveQuery(queryId);
      await loadQueries();
    } catch (resolveError) {
      console.error("Error resolving query:", resolveError);
      setError("Unable to resolve the query.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lectureId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <p className="text-lg font-semibold text-gray-900">No lecture selected</p>
          <p className="text-gray-600">Open this page from a lecture card so we know which lecture query thread to show.</p>
          <button
            onClick={() => navigate(user?.role === "teacher" ? "/teacherdashboard/lectures" : "/studentdashboard/lectures")}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
          >
            Back to lectures
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Lecture Queries</p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-1">{lecture?.title || "Selected lecture"}</h1>
            <p className="text-gray-600 mt-2">
              {lecture?.subject ? `${lecture.subject} • ` : ""}
              {lecture?.facultyName || lecture?.teacherName || "Teacher not available"}
            </p>
          </div>
          <button
            onClick={() => navigate(user?.role === "teacher" ? "/teacherdashboard/lectures" : "/studentdashboard/lectures")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {user?.role === "student" && (
        <form onSubmit={handleSubmitQuestion} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ask your question</label>
            <textarea
              rows="4"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Write your doubt about this lecture here..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !question.trim()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Query"}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-gray-500">
            Loading queries...
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-gray-500">
            {user?.role === "teacher"
              ? "No student queries for this lecture yet."
              : "You have not asked any query for this lecture yet."}
          </div>
        ) : (
          queries.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {user?.role === "teacher" ? `${item.studentName} • ${item.studentRollNo || item.studentEmail || item.studentId}` : "Your query"}
                  </p>
                  <p className="text-gray-900 font-medium mt-2">{item.question}</p>
                </div>
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

              <div className="text-xs text-gray-500">
                Asked on {formatDate(item.createdAt)}
              </div>

              {item.answer ? (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Teacher Answer</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
                  <p className="text-xs text-gray-500">
                    {item.answeredBy ? `Answered by ${item.answeredBy}` : "Answered"} {item.answeredAt ? `on ${formatDate(item.answeredAt)}` : ""}
                  </p>
                  {user?.role === "student" && item.status !== "resolved" && (
                    <button
                      onClick={() => handleResolve(item._id)}
                      disabled={submitting}
                      className="mt-2 px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-60"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {item.status === "resolved" && (
                    <p className="text-xs text-green-700">
                      Resolved on {formatDate(item.resolvedAt)}. This chat will be deleted automatically after 1 week.
                    </p>
                  )}
                </div>
              ) : user?.role === "teacher" && item.status !== "resolved" ? (
                <div className="space-y-3">
                  <textarea
                    rows="4"
                    value={answerDrafts[item._id] || ""}
                    onChange={(event) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [item._id]: event.target.value,
                      }))
                    }
                    placeholder="Write the answer for this student..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleSubmitAnswer(item._id)}
                    disabled={submitting || !(answerDrafts[item._id] || "").trim()}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Waiting for teacher response.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LectureQueries;
