import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AdminCreateUser() {
  const { user: adminUser, token, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // 🔐 Redirect if not authenticated as admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !adminUser || adminUser.role !== "admin") {
        navigate("/admin-login");
      }
    }
  }, [adminUser, isAuthenticated, loading, navigate]);

  // 📝 FORM STATE
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    college: "Degree College",
    degree: ""
  });

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔄 HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // 🚀 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!token) {
        setError("Admin authentication required. Please login again.");
        navigate("/admin-login");
        return;
      }

      if (!formData.fullName.trim()) {
        setError("Full name is required.");
        return;
      }

      if (!formData.college) {
        setError("Please select a college.");
        return;
      }

      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase()
      };

      const response = await fetch(
        "http://localhost:5000/api/auth/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `User created successfully! Name: ${data.user.fullName}, Email: ${data.user.email}`
        );

        // Reset form
        setFormData({
          fullName: "",
          email: "",
          password: "",
          role: "student",
          college: "Degree College",
          degree: ""
        });
      } else {
        setError(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setError(
        "Network error while creating user. Please check your connection and try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ⏳ Show loading during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute w-[500px] h-[500px] bg-white blur-[120px] opacity-30 -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-white blur-[120px] opacity-30 bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-10 w-[420px] border border-gray-100"
      >
        <h1 className="text-2xl font-semibold text-center mb-2">
          Create New User
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Create student or teacher accounts
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* FULL NAME */}
          <input
            name="fullName"
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* EMAIL */}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* PASSWORD */}
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* ROLE SELECTOR */}
          <div className="flex bg-gray-100 rounded-full p-1">
            {["student", "teacher"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, role: r }))
                }
                className={`w-1/2 py-2 rounded-full text-sm capitalize transition ${
                  formData.role === r
                    ? "bg-white shadow font-medium"
                    : "text-gray-500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* COLLEGE */}
          <select
            name="college"
            value={formData.college}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Select College</option>
            <option value="Degree College">Degree College</option>
            <option value="Junior College">Junior College</option>
          </select>

          {/* DEGREE (Only Student) */}
          {formData.role === "student" && (
            <input
              name="degree"
              type="text"
              placeholder="Degree (e.g., Bachelor of Computer Science)"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}

          {/* SUBJECT (Only Teacher) */}
          {formData.role === "teacher" && (
            <input
              name="degree"
              type="text"
              placeholder="Subject (e.g., Computer Networks)"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={formLoading}
            className={`w-full py-3 rounded-full font-semibold text-sm transition ${
              formLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : " text-white bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {formLoading ? "Creating User..." : `Create ${formData.role}`}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a
            href="/admindashboard"
            className="text-sm text-gray-600 hover:text-gray-800 block"
          >
            ← Back to Admin Dashboard
          </a>
          <a
            href="/admin-login"
            className="text-sm text-gray-600 hover:text-gray-800 block"
          >
            Admin Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}