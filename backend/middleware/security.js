import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, param, query, validationResult } from 'express-validator';

// ======================
// RATE LIMITING MIDDLEWARE (DISABLED)
// ======================

// General rate limiting for all endpoints - DISABLED
// export const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//     retryAfter: '15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   // Skip successful requests (less than 400 status code)
//   skipSuccessfulRequests: false,
//   // Skip failed requests
//   skipFailedRequests: false,
//   // Custom handler for rate limit exceeded
//   handler: (req, res, next) => {
//     console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
//     res.status(429).json({
//       error: 'Too many requests',
//       message: 'Rate limit exceeded. Please try again later.',
//       retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Export empty general limiter to avoid breaking imports
export const generalLimiter = (req, res, next) => next();

// Strict rate limiting for authentication endpoints - DISABLED
// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 auth requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later.',
//     retryAfter: '15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipSuccessfulRequests: false,
//   handler: (req, res, next) => {
//     console.log(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
//     res.status(429).json({
//       error: 'Too many authentication attempts',
//       message: 'Too many login/registration attempts. Please try again later.',
//       retryAfter: Math.ceil(15 * 60),
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Export empty auth limiter to avoid breaking imports
export const authLimiter = (req, res, next) => next();

// Rate limiting for file uploads - DISABLED
// export const uploadLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 20, // Limit each IP to 20 uploads per hour
//   message: {
//     error: 'Too many file uploads, please try again later.',
//     retryAfter: '1 hour'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res, next) => {
//     console.log(`Upload rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
//     res.status(429).json({
//       error: 'Too many file uploads',
//       message: 'Upload limit exceeded. Please try again later.',
//       retryAfter: Math.ceil(60 * 60),
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Export empty upload limiter to avoid breaking imports
export const uploadLimiter = (req, res, next) => next();

// Rate limiting for activity tracking - DISABLED
// export const activityLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 30, // Limit each IP to 30 activity requests per minute
//   message: {
//     error: 'Too many activity requests, please try again later.',
//     retryAfter: '1 minute'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res, next) => {
//     console.log(`Activity rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
//     res.status(429).json({
//       error: 'Too many activity requests',
//       message: 'Activity tracking limit exceeded. Please try again later.',
//       retryAfter: 60,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Export empty activity limiter to avoid breaking imports
export const activityLimiter = (req, res, next) => next();

// ======================
// SECURITY HEADERS MIDDLEWARE
// ======================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// ======================
// INPUT VALIDATION SCHEMAS
// ======================

// User registration validation
export const validateUserRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('role')
    .trim()
    .isIn(['student', 'teacher'])
    .withMessage('Role must be either student or teacher'),
  
  body('college')
    .trim()
    .isIn(['Junior College', 'Degree College'])
    .withMessage('College must be either Junior College or Degree College'),
  
  // Student-specific validations
  body('year')
    .if(body('role').equals('student'))
    .trim()
    .isIn(['FY', 'SY', 'TY'])
    .withMessage('Year must be FY, SY, or TY'),
  
  body('semester')
    .if(body('role').equals('student') && body('college').equals('Degree College'))
    .trim()
    .isInt({ min: 1, max: 6 })
    .withMessage('Semester must be between 1 and 6'),
  
  body('stream')
    .if(body('role').equals('student') && body('college').equals('Junior College'))
    .trim()
    .isIn(['Science', 'Commerce', 'Arts'])
    .withMessage('Stream must be Science, Commerce, or Arts'),
  
  body('degree')
    .if(body('role').equals('student') && body('college').equals('Degree College'))
    .trim()
    .isIn(['BSc', 'BCom', 'BAF', 'BMS'])
    .withMessage('Degree must be BSc, BCom, BAF, or BMS'),
  
  // Teacher-specific validations
  body('subject')
    .if(body('role').equals('teacher'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  
  body('course')
    .if(body('role').equals('teacher') && body('college').equals('Degree College'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Course must be between 2 and 50 characters')
];

// Login validation
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password must be between 1 and 128 characters')
];

// Assignment creation validation
export const validateAssignmentCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape(),
  
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters')
    .escape(),
  
  body('class')
    .trim()
    .isIn(['FYJC', 'SYJC', 'FYBScCS', 'SYBScCS', 'TYBScCS', 'FYBMS', 'SYBMS', 'TYBMS', 'FYBCom', 'SYBCom', 'TYBCom', 'FYBAF', 'SYBAF', 'TYBAF'])
    .withMessage('Invalid class format'),
  
  body('college')
    .trim()
    .isIn(['Junior College', 'Degree College'])
    .withMessage('College must be either Junior College or Degree College'),
  
  body('deadline')
    .trim()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .toDate()
];

// Exam creation validation
export const validateExamCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape(),
  
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters')
    .escape(),
  
  body('examDate')
    .trim()
    .isISO8601()
    .withMessage('Exam date must be a valid date')
    .toDate(),
  
  body('duration')
    .trim()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes')
    .toInt(),
  
  body('totalMarks')
    .trim()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total marks must be between 1 and 1000')
    .toInt(),
  
  body('class')
    .trim()
    .isIn(['FYJC', 'SYJC', 'FYBScCS', 'SYBScCS', 'TYBScCS', 'FYBMS', 'SYBMS', 'TYBMS', 'FYBCom', 'SYBCom', 'TYBCom', 'FYBAF', 'SYBAF', 'TYBAF'])
    .withMessage('Invalid class format'),
  
  body('college')
    .trim()
    .isIn(['Junior College', 'Degree College'])
    .withMessage('College must be either Junior College or Degree College'),
  
  body('examType')
    .trim()
    .isIn(['midterm', 'final', 'quiz', 'practical', 'assignment'])
    .withMessage('Exam type must be midterm, final, quiz, practical, or assignment'),
  
  body('instructions')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Instructions must not exceed 1000 characters')
    .escape()
];

// Activity tracking validation
export const validateActivityTracking = [
  body('activityType')
    .trim()
    .isIn(['login', 'lecture_view', 'assignment_download', 'assignment_submission'])
    .withMessage('Invalid activity type'),
  
  body('studentId')
    .trim()
    .isMongoId()
    .withMessage('Invalid student ID format'),
  
  body('studentName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Student name must be between 2 and 50 characters')
    .escape(),
  
  body('studentEmail')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('college')
    .trim()
    .isIn(['Junior College', 'Degree College'])
    .withMessage('College must be either Junior College or Degree College'),
  
  body('class')
    .trim()
    .isIn(['FYJC', 'SYJC', 'FYBScCS', 'SYBScCS', 'TYBScCS', 'FYBMS', 'SYBMS', 'TYBMS', 'FYBCom', 'SYBCom', 'TYBCom', 'FYBAF', 'SYBAF', 'TYBAF'])
    .withMessage('Invalid class format')
];

// MongoDB ID validation
export const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`)
];

// ======================
// VALIDATION RESULT HANDLER
// ======================

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// ======================
// FILE UPLOAD SECURITY
// ======================

export const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

export const fileLimits = {
  fileSize: 10 * 1024 * 1024, // 10MB max file size
  files: 1 // Max 1 file per request
};