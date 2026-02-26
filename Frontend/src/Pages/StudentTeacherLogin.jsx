import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function StudentTeacherLogin() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const result =
        await login(
          formData.email,
          formData.password
        );

      if (result.success) {

        if (
          result.user.role === "admin"
        ) {

          setError(
            "This login is for students and teachers only. Please use the admin login."
          );

        } else {

          navigate("/app");

        }

      } else {

        setError(result.message);

      }

    } catch {

      setError(
        "An unexpected error occurred. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      px-4
      py-10
      bg-gradient-to-br
      from-indigo-50
      via-white
      to-purple-50
      relative
      overflow-hidden
    "
    >

      {/* BACKGROUND */}
      <div className="absolute w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-indigo-200 blur-[120px] opacity-30 -top-20 -left-20" />

      <div className="absolute w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-purple-200 blur-[120px] opacity-30 bottom-0 right-0" />


      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
        className="
        bg-white/80
        backdrop-blur-xl
        shadow-xl
        rounded-3xl
        p-6 sm:p-10
        w-full
        max-w-md
        border
        border-gray-100
      "
      >

        {/* TITLE */}
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-2">
          Student & Teacher Login
        </h1>

        <p className="text-center text-gray-500 mb-8 text-sm sm:text-base">
          Sign in to your account
        </p>


        {/* ERROR */}
        {error && (

          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>

        )}


        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />


          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium transition"
          >

            {loading
              ? "Processing..."
              : "Login"}

          </button>

        </form>


        <div className="mt-6 text-center">

          <a
            href="/admin-login"
            className="text-sm text-gray-600 hover:text-gray-800 transition"
          >

            Admin Login →

          </a>

        </div>


        <p className="text-center text-gray-500 text-sm mt-6">
          Contact your administrator for account creation
        </p>

      </motion.div>

    </div>

  );
}