import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function QuizAttempt() {
  const { examId } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState({ questions: [] });
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/quiz/${examId}`)
      .then((res) => {
        setQuiz(res.data);
        setAnswers(new Array(res.data?.questions?.length || 0).fill(null));
      });
  }, [examId]);

  const handleSelect = (qIndex, option) => {
    const updated = [...answers];
    updated[qIndex] = option;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quiz/submit`,
        {
          examId,
          answers,
          studentId: user.id,
          // ⭐ CRITICAL FIX
          studentModel:
            user.college === "Degree College" ? "DCStudent" : "JCStudent",
        }
      );

      alert(`Quiz submitted! Score: ${res.data.score}/${res.data.total}`);
      window.location.href = "/studentdashboard";
    } catch (err) {
      console.error("Submit Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  if (!quiz?.questions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{quiz.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Answer all questions and submit the quiz
          </p>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((q, i) => (
            <div key={i} className="bg-white border rounded-xl shadow-sm p-6">
              <p className="font-semibold mb-4">Question {i + 1}</p>
              <p className="mb-5">{q.question}</p>

              <div className="space-y-3">
                {q.options.map((opt, j) => (
                  <label key={j} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      onChange={() => handleSelect(i, opt)}
                      className="accent-indigo-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}