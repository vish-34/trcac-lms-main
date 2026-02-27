import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import subjectRoutes from "./routes/subject.js";
import progressRoutes from "./routes/progressRoutes.js";

dotenv.config();

const app = express();

// ======================
// PORT
// ======================

const PORT = process.env.PORT || 5000;

// ======================
// MIDDLEWARE
// ======================

// Allow frontend (Vercel) to talk to backend

app.use(
  cors({
    origin: "*", // OK for demo (later restrict)

    methods: ["GET", "POST", "PUT", "DELETE"],

    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
  }),
);

// ======================
// HEALTH CHECK (IMPORTANT)
// ======================

app.get("/", (req, res) => {
  res.send("LMS Backend Running ✅");
});

// ======================
// ROUTES
// ======================

app.use("/api/auth", authRoutes);

app.use("/api/lecture", lectureRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/progress", progressRoutes);

// ======================
// MONGODB CONNECTION
// ======================

mongoose
  .connect(
    process.env.MONGO_URI,

    {
      serverSelectionTimeoutMS: 5000,
    },
  )

  .then(() => {
    console.log("Connected to MongoDB Atlas ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })

  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
