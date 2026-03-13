import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AdminCreateUser() {
  const { user: adminUser, token, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated as admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !adminUser || adminUser.role !== "admin") {
        navigate("/admin-login");
      }
    }
  }, [adminUser, isAuthenticated, loading, navigate]);

  // FORM STATE (Semester Removed)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    college: "Degree College",
    rollNo: "",
    degree: "",
    year: ""
  });

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // SUBMIT
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

      if (formData.role === "student" && !formData.rollNo.trim()) {
        setError("Roll number is required.");
        return;
      }

      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        rollNo: formData.role === "student" ? formData.rollNo.trim() : ""
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/create-user`,
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
          rollNo: "",
          degree: "",
          year: ""
        });
      } else {
        setError(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setError(
        "Network error while creating user. Please check your connection."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ⏳ Auth loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">

      {/* Background blur */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-200 blur-[140px] opacity-20 -top-20 -left-20" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-200 blur-[140px] opacity-20 bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-xl shadow-xl rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-gray-100 p-6 sm:p-10"
      >

        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-2">
          Create New User
        </h1>

        <p className="text-center text-gray-500 mb-6">
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

          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
          />

          {/* ROLE SWITCH */}
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
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select College</option>
            <option value="Degree College">Degree College</option>
            <option value="Junior College">Junior College</option>
          </select>

          {formData.role === "student" && (
            <input
              name="rollNo"
              placeholder="Roll Number"
              value={formData.rollNo}
              required
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {/* DEGREE / STREAM */}
          {formData.role === "student" && (
            <select
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select {formData.college === "Junior College" ? "Stream" : "Degree"}</option>

              {formData.college === "Junior College" ? (
                <>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </>
              ) : (
                <>
                  <option value="B.Sc (CS)">B.Sc (CS)</option>
                  <option value="B.Sc (IT)">B.Sc (IT)</option>
                  <option value="BA">BA</option>
                  <option value="BAMMC">BAMMC</option>
                  <option value="BCom">BCom</option>
                  <option value="BMS">BMS</option>
                  <option value="BAF">BAF</option>
                </>
              )}
            </select>
          )}

          {/* YEAR */}
          {formData.role === "student" && formData.college && (
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Year</option>

              {formData.college === "Junior College" ? (
                <>
                  <option value="FY">First Year (FY)</option>
                  <option value="SY">Second Year (SY)</option>
                </>
              ) : (
                <>
                  <option value="FY">First Year</option>
                  <option value="SY">Second Year</option>
                  <option value="TY">Third Year</option>
                </>
              )}
            </select>
          )}

          {/* TEACHER SUBJECT */}
          {formData.role === "teacher" && (
            <input
              name="degree"
              placeholder="Subject"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <button
            type="submit"
            disabled={formLoading}
            className={`w-full py-3 rounded-full font-semibold transition ${
              formLoading
                ? "bg-gray-300"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {formLoading ? "Creating User..." : `Create ${formData.role}`}
          </button>

        </form>

      </motion.div>
    </div>
  );
}
