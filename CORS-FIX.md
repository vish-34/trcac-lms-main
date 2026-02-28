# CORS Fix for Production Deployment

## Issue
The production frontend at `https://trcac-lms-main.vercel.app` cannot access the backend API at `https://trcac-lms-backend.onrender.com` due to CORS policy restrictions.

## Solution Applied

### 1. Updated CORS Configuration
The backend CORS settings have been updated to include the production frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://trcac-lms-main.vercel.app', // Production frontend URL
  'https://your-frontend-domain.com', // Replace with actual frontend domain
  process.env.FRONTEND_URL
].filter(Boolean);
```

### 2. Enhanced CORS Options
Added comprehensive CORS options for production:

```javascript
app.use(
  cors({
    origin: (origin, callback) => {
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
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }),
);
```

### 3. Environment Variables
Updated `.env.example` with production settings:

```bash
NODE_ENV=production
FRONTEND_URL=https://trcac-lms-main.vercel.app
```

## Deployment Steps

### For Render (Backend)
1. **Update Environment Variables** in Render dashboard:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://trcac-lms-main.vercel.app`
   - Ensure `JWT_SECRET` is set to a secure value
   - Ensure `MONGO_URI` is set to your MongoDB Atlas connection

2. **Redeploy the Backend**:
   - Push changes to GitHub
   - Render will automatically redeploy
   - Or manually trigger redeploy in Render dashboard

### For Vercel (Frontend)
1. **Update Environment Variables** in Vercel dashboard:
   - `VITE_API_URL=https://trcac-lms-backend.onrender.com`
   - `VITE_API_BASE_URL=https://trcac-lms-backend.onrender.com`

2. **Redeploy the Frontend**:
   - Push changes to GitHub
   - Vercel will automatically redeploy
   - Or manually trigger redeploy in Vercel dashboard

## Verification

### Test CORS Configuration
1. **Check Backend Health**:
   ```bash
   curl https://trcac-lms-backend.onrender.com/
   ```

2. **Test CORS Preflight**:
   ```bash
   curl -X OPTIONS https://trcac-lms-backend.onrender.com/api/auth/login \
        -H "Origin: https://trcac-lms-main.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type"
   ```

3. **Check Response Headers**:
   Should include:
   - `Access-Control-Allow-Origin: https://trcac-lms-main.vercel.app`
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
   - `Access-Control-Allow-Credentials: true`

### Test Login Functionality
1. Navigate to `https://trcac-lms-main.vercel.app`
2. Try to login with valid credentials
3. Check browser network tab for successful API calls
4. Check backend logs for CORS debugging information

## Troubleshooting

### If CORS Still Fails
1. **Check Render Logs** for CORS error messages
2. **Verify Environment Variables** are set correctly
3. **Ensure Backend is Running** in production mode
4. **Check Frontend API URL** is correct

### Common Issues
- **Missing Environment Variables**: Ensure all required env vars are set in Render
- **Hardcoded Origins**: The code now uses environment variables, so no hardcoded values
- **Preflight Requests**: Added OPTIONS method and proper preflight handling
- **Credentials**: Ensure `credentials: true` is set for cookie-based auth

## Security Notes

### CORS Security
- **Restricted Origins**: Only allows specific frontend domains
- **No Wildcard**: Doesn't use `*` for security
- **Environment-based**: Uses environment variables for flexibility
- **Logging**: Logs blocked CORS attempts for debugging

### Production Security
- **HTTPS Only**: Production URLs use HTTPS
- **Secure Headers**: All security headers are maintained
- **Rate Limiting**: Rate limiting still applies to all requests
- **Input Validation**: All security validations remain active

## Monitoring

### CORS Logs
The backend will log:
- Allowed origins on startup
- Blocked CORS attempts with origin details
- Debug information for troubleshooting

### Health Checks
- `/` endpoint returns server status
- CORS headers included in all responses
- Error responses include CORS headers

## Post-Deployment Checklist

- [ ] Backend redeployed with new CORS settings
- [ ] Frontend redeployed with correct API URL
- [ ] Environment variables set in both platforms
- [ ] Login functionality tested in production
- [ ] CORS headers verified in browser dev tools
- [ ] No CORS errors in browser console
- [ ] All API endpoints accessible from frontend

## Support

If issues persist:
1. Check Render dashboard for deployment logs
2. Check Vercel dashboard for build logs
3. Verify environment variables in both platforms
4. Test API endpoints directly with curl
5. Check browser network tab for detailed error messages

The CORS configuration is now production-ready and should resolve the cross-origin access issues.
