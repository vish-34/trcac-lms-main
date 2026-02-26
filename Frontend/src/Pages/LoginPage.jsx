import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {

  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  
  // FORM STATE
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
    college: "",
    degree: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // For registration, include admin token if user is admin
        const token = localStorage.getItem('token');
        result = await register(formData, token);
      }

      if (result.success) {
        // Redirect based on role
        if (result.user.role === 'admin') {
          navigate('/admindashboard');
        } else {
          navigate('/app');
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If user is not admin, show only login form
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-200 blur-[120px] opacity-30 -top-20 -left-20" />
        <div className="absolute w-[400px] h-[400px] bg-purple-200 blur-[120px] opacity-30 bottom-0 right-0" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-10 w-[420px] border border-gray-100"
        >
          {/* TITLE */}
          <h1 className="text-2xl font-semibold text-center mb-2">
            TRCAC Nexus Login
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Sign in to your account
          </p>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              required
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* PASSWORD */}
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              required
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? "Processing..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Contact your administrator for account creation
          </p>
        </motion.div>
      </div>
    );
  }

  // Admin view - can register new users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-200 blur-[120px] opacity-30 -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-purple-200 blur-[120px] opacity-30 bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
        className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-10 w-[420px] border border-gray-100"
      >
        {/* TITLE */}
        <h1 className="text-2xl font-semibold text-center mb-2">
          TRCAC Nexus Admin {isLogin ? "Login" : "Create User"}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isLogin ? "Sign in to your admin account" : "Create new user account"}
        </p>

        {/* LOGIN/CREATE USER TOGGLE */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-8">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-full text-sm capitalize transition
              ${isLogin ? "bg-white shadow font-medium" : "text-gray-500"}
            `}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-full text-sm capitalize transition
              ${!isLogin ? "bg-white shadow font-medium" : "text-gray-500"}
            `}
          >
            Create User
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {/* PASSWORD */}
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {/* ROLE SELECTION (only for user creation) */}
          {!isLogin && (
            <div className="flex bg-gray-100 rounded-full p-1 mb-8">
              {["teacher", "student"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`w-1/2 py-2 rounded-full text-sm capitalize transition
                    ${formData.role === r
                      ? "bg-white shadow font-medium"
                      : "text-gray-500"
                    }
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* TEACHER EXTRA FIELDS */}
          {!isLogin && formData.role === "teacher" && (
            <select
              name="college"
              value={formData.college}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select Section</option>
              <option value="Degree College">Degree College</option>
              <option value="Junior College">Junior College</option>
            </select>
          )}

          {/* STUDENT EXTRA FIELDS */}
          {!isLogin && formData.role === "student" && (
            <input
              name="degree"
              type="text"
              placeholder="Degree"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium transition"
          >
            {loading ? "Processing..." : (isLogin ? "Login" : `Create ${formData.role}`)}
          </button>
        </form>
      </motion.div>
    </div>
  );
}