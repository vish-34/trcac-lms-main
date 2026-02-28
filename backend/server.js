import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Security imports
import { 
  generalLimiter, 
  authLimiter, 
  uploadLimiter, 
  activityLimiter,
  securityHeaders 
} from "./middleware/security.js";

import authRoutes from "./routes/auth.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import subjectRoutes from "./routes/subject.js";
import progressRoutes from "./routes/progressRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import examRoutes from "./routes/examRoutes.js";

dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ======================
// SECURITY MIDDLEWARE
// ======================

// Apply security headers
app.use(securityHeaders);

// Apply general rate limiting
app.use(generalLimiter);

// ======================
// PORT
// ======================

const PORT = process.env.PORT || 5000;

// ======================
// MIDDLEWARE
// ======================

// CORS configuration - more restrictive than before
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://trcac-lms-main.vercel.app', // Production frontend URL
  'https://your-frontend-domain.com', // Replace with actual frontend domain
  process.env.FRONTEND_URL
].filter(Boolean);

// For production, allow the specific frontend domain
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://trcac-lms-main.vercel.app');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked for origin: ${origin}`);
        console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  }),
);

app.use(
  express.json({
    limit: "10mb",
    // Add security to JSON parsing
    strict: true,
    type: 'application/json'
  }),
);

// ======================
// HEALTH CHECK (IMPORTANT)
// ======================

app.get("/", (req, res) => {
  res.json({
    status: "LMS Backend Running ✅",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ======================
// RATE LIMITED ROUTES
// ======================

// Apply strict rate limiting to authentication routes
app.use("/api/auth", authLimiter, authRoutes);

// Apply upload rate limiting to assignment and exam routes that handle file uploads
app.use("/api/assignments", uploadLimiter, assignmentRoutes);
app.use("/api/exams", uploadLimiter, examRoutes);

// Apply activity rate limiting to activity tracking
// app.use("/api/activity", activityLimiter, activityRoutes);
app.use("/api/activity", activityRoutes);

// Other routes with general rate limiting
app.use("/api/lecture", lectureRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

// ======================
// SECURE FILE SERVING
// ======================

// Serve uploaded files with security headers
app.use("/uploads", (req, res, next) => {
  // Add security headers for file uploads
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent directory traversal
  const requestedPath = req.path;
  if (requestedPath.includes('..') || requestedPath.includes('~')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}, express.static(path.join(__dirname, "uploads"), {
  maxAge: '1h', // Cache for 1 hour
  etag: true,
  lastModified: true
}));

// ======================
// GLOBAL ERROR HANDLING
// ======================

// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Access denied from this origin',
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});

// Handle rate limit errors
app.use((err, req, res, next) => {
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: err.message,
      retryAfter: err.retryAfter || 60,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});

// Handle validation errors
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Malformed request data',
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});

// Handle file upload errors
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'File size exceeds the 10MB limit',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Too Many Files',
      message: 'Only one file can be uploaded at a time',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid File Type',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

// ======================
// MONGODB CONNECTION
// ======================

mongoose
  .connect(
    process.env.MONGO_URI,
    {
      serverSelectionTimeoutMS: 5000,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB Atlas ✅");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
