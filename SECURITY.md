# TRCAC LMS Security Documentation

## Overview
This document outlines the security measures implemented in the TRCAC Learning Management System to protect against common web vulnerabilities and ensure data integrity.

## Security Features Implemented

### 1. Rate Limiting
- **General Rate Limiting**: 100 requests per 15 minutes per IP
- **Authentication Rate Limiting**: 5 auth requests per 15 minutes per IP
- **Upload Rate Limiting**: 20 uploads per hour per IP
- **Activity Rate Limiting**: 30 activity requests per minute per IP
- **Graceful 429 Responses**: Clear error messages with retry-after headers

### 2. Input Validation & Sanitization
- **Schema-based Validation**: Using express-validator for all user inputs
- **Type Checking**: Strict type enforcement for all fields
- **Length Limits**: Maximum character limits on all text inputs
- **XSS Protection**: HTML escaping for user-provided content
- **SQL Injection Prevention**: Mongoose ODM prevents injection attacks
- **File Validation**: Strict file type and size restrictions

### 3. Secure API Key Handling
- **Environment Variables**: All secrets stored in environment variables
- **No Hard-coded Keys**: Removed all hard-coded API keys and secrets
- **JWT Secret Management**: Secure JWT secret with proper entropy
- **Frontend Environment**: Vite environment variables for API URLs

### 4. Security Headers
- **Helmet.js**: Comprehensive security header implementation
- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **HSTS**: HTTP Strict Transport Security enabled
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-XSS-Protection**: Browser XSS protection enabled

### 5. CORS Configuration
- **Restricted Origins**: Only allowed domains can access API
- **Environment-based**: Configurable allowed origins
- **Credentials Support**: Secure credential handling
- **Preflight Caching**: Optimized CORS preflight requests

### 6. File Upload Security
- **File Type Validation**: Only allowed file types accepted
- **File Size Limits**: Maximum 10MB file size
- **Secure Filenames**: Randomized filenames to prevent directory traversal
- **Virus Scanning**: Basic file validation (can be extended)
- **Upload Directory Protection**: Secure file serving with proper headers

### 7. Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: 24-hour token expiration
- **Role-based Access**: Proper role checking for all endpoints
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure session handling

## Environment Variables

### Backend (.env)
```bash
# Core Configuration
PORT=5000
MONGO_URI=mongodb://localhost:27017/trcac-lms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Security Settings
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_UPLOAD_MAX=20
RATE_LIMIT_ACTIVITY_MAX=30

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain

# Session Settings
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
SESSION_MAX_AGE=86400000
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000

# Security Settings
VITE_APP_NAME=TRCAC LMS
VITE_APP_VERSION=1.0.0

# Development Settings
VITE_DEV_MODE=true
VITE_DEBUG=false
```

## Security Best Practices

### For Development
1. **Never commit .env files** to version control
2. **Use strong, unique secrets** for JWT and session management
3. **Regularly update dependencies** to patch security vulnerabilities
4. **Enable security headers** in production
5. **Monitor rate limiting** for abuse patterns

### For Production
1. **Use HTTPS** for all communications
2. **Set NODE_ENV=production** to enable production security features
3. **Configure proper CORS origins** for your domain
4. **Enable database authentication** and encryption
5. **Implement logging and monitoring** for security events
6. **Regular security audits** and penetration testing

### For File Uploads
1. **Scan uploaded files** for malware
2. **Implement virus scanning** on upload
3. **Store files in secure location** (not web-accessible)
4. **Generate unique filenames** to prevent overwrites
5. **Validate file contents** not just extensions

## Rate Limiting Details

### General Endpoints
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: 429 with retry-after header

### Authentication Endpoints
- **Window**: 15 minutes  
- **Max Requests**: 5 per IP
- **Response**: 429 with retry-after header

### File Upload Endpoints
- **Window**: 1 hour
- **Max Requests**: 20 per IP
- **Response**: 429 with retry-after header

### Activity Tracking Endpoints
- **Window**: 1 minute
- **Max Requests**: 30 per IP
- **Response**: 429 with retry-after header

## Input Validation Rules

### User Registration
- **Full Name**: 2-50 characters, letters and spaces only
- **Email**: Valid email format, normalized to lowercase
- **Password**: 8-128 characters, must contain uppercase, lowercase, number, and special character
- **Role**: Must be 'student' or 'teacher'
- **College**: Must be 'Junior College' or 'Degree College'

### Assignment Creation
- **Title**: 3-100 characters, HTML escaped
- **Description**: Max 500 characters, HTML escaped
- **Subject**: 2-50 characters, HTML escaped
- **Class**: Must match predefined class formats
- **Deadline**: Valid ISO date format

### Exam Creation
- **Title**: 3-100 characters, HTML escaped
- **Description**: Max 500 characters, HTML escaped
- **Subject**: 2-50 characters, HTML escaped
- **Duration**: 15-480 minutes
- **Total Marks**: 1-1000 points
- **Exam Type**: Must be 'midterm', 'final', 'quiz', 'practical', or 'assignment'

## Security Headers Implemented

### Content Security Policy
```javascript
defaultSrc: ["'self'"]
styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
fontSrc: ["'self'", "https://fonts.gstatic.com"]
imgSrc: ["'self'", "data:", "https:"]
scriptSrc: ["'self'"]
connectSrc: ["'self'"]
frameSrc: ["'none'"]
objectSrc: ["'none'"]
```

### Other Headers
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000; includeSubDomains; preload

## Error Handling

### Security-focused Error Responses
- **Validation Errors**: 400 with detailed field-level feedback
- **Rate Limit Errors**: 429 with retry-after information
- **Authentication Errors**: 401/403 with generic messages
- **File Upload Errors**: 413/400 with specific error details
- **Server Errors**: 500 with minimal information in production

### Logging
- **Security Events**: Rate limit violations, failed auth attempts
- **File Upload Events**: Successful uploads, rejected files
- **Validation Errors**: Input validation failures
- **System Errors**: Application errors with context

## Monitoring & Alerting

### Security Metrics to Monitor
1. **Rate Limit Violations**: Spikes in 429 responses
2. **Failed Authentication**: Unusual login failure patterns
3. **File Upload Rejections**: Suspicious file upload attempts
4. **Validation Errors**: Input validation failure patterns
5. **CORS Violations**: Unauthorized cross-origin requests

### Alert Thresholds
- **Rate Limit**: >100 violations per hour
- **Auth Failures**: >50 failed logins per hour
- **File Uploads**: >20 rejected uploads per hour
- **Validation Errors**: >100 validation failures per hour

## Deployment Security Checklist

### Pre-deployment
- [ ] Update all environment variables with production values
- [ ] Generate strong, unique secrets for JWT and session
- [ ] Configure proper CORS origins for production domain
- [ ] Enable HTTPS and configure SSL certificates
- [ ] Set NODE_ENV=production
- [ ] Configure database authentication and encryption
- [ ] Enable security monitoring and logging

### Post-deployment
- [ ] Test rate limiting functionality
- [ ] Verify CORS configuration
- [ ] Test file upload security
- [ ] Validate input validation rules
- [ ] Check security headers in browser dev tools
- [ ] Monitor error logs for security issues
- [ ] Set up security monitoring and alerting

## Security Testing

### Automated Tests
- Input validation testing
- Rate limiting testing
- File upload security testing
- Authentication flow testing
- CORS configuration testing

### Manual Testing
- Penetration testing
- Security audit review
- Vulnerability scanning
- Code review for security issues

## Compliance

This security implementation addresses:
- **OWASP Top 10** vulnerabilities
- **Data protection** requirements
- **Access control** standards
- **Secure coding** practices
- **Privacy** considerations

## Contact

For security concerns or vulnerabilities, please contact the development team immediately.

---
*Last updated: 2024-02-28*
*Version: 1.0.0*
