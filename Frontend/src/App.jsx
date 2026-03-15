import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Pages
import HomePage from './Pages/HomePage.jsx';
import AdminLogin from './Pages/AdminLogin.jsx';
import StudentTeacherLogin from './Pages/StudentTeacherLogin.jsx';
import AdminCreateUser from './Pages/AdminCreateUser.jsx';
import AdminDashboard from './Pages/AdminDashboard/AdminDashboard.jsx';
import Dashboard from './Pages/StudentDashboard/Dashboard.jsx';
import StudentHome from './Pages/StudentDashboard/Home.jsx';
import StudentLectures from './Pages/StudentDashboard/Lectures.jsx';
import StudentAssignment from './Pages/StudentDashboard/Assignments.jsx';
import StudentSubmitAssignment from './Pages/StudentDashboard/SubmitAssignment.jsx';
import StudentSubjects from './Pages/StudentDashboard/Subjects.jsx';
import LectureHistory from './Pages/StudentDashboard/LectureHistory.jsx';
import StudentAttendance from './Pages/StudentDashboard/Attendance.jsx';
import QueryUpdates from './Pages/StudentDashboard/QueryUpdates.jsx';
import TeacherDashboard from './Pages/TeacherDashboard/TeacherDashboard.jsx';
import TeacherHome from './Pages/TeacherDashboard/TeacherHome.jsx';
import TeacherLectures from './Pages/TeacherDashboard/TeacherLectures.jsx';
import BulkEnrollment from './Pages/AdminDashboard/BulkEnrollment.jsx';
import BulkSubjectEnrollment from './Pages/AdminDashboard/BulkSubjectEnrollment.jsx';
import TeacherAssignment from './Pages/TeacherDashboard/Assignments.jsx';
import TeacherExams from './Pages/TeacherDashboard/TeacherExams.jsx';
import AllActivity from './Pages/TeacherDashboard/AllActivity.jsx';
import AdminHome from './Pages/AdminDashboard/AdminHome.jsx';
import AdminLectures from './Pages/AdminDashboard/AdminLectures.jsx';
import AdminCredentials from './Pages/AdminDashboard/AdminCredentials.jsx';
import UserManagement from './Pages/AdminDashboard/UserManagement.jsx';
import AdminAddLecture from './components/Admindashboard/AdminAddLecture.jsx';
import AdminSubjects from './Pages/AdminDashboard/AdminSubjects.jsx';
import AdminAddSubjects from './Pages/AdminDashboard/AdminAddSubjects.jsx';
import Exams from './components/Studentdashboard/Exams.jsx';
import QuizAttempt from './components/Studentdashboard/QuizAttempt.jsx';
import QuizResults from './components/Teacherdashboard/QuizResults.jsx';
import LectureQueries from './Pages/LectureQueries.jsx';

// Navigation Guard Component
const NavigationGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Block navigation to login pages if authenticated
  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      const currentPath = location.pathname;
      const loginPaths = ['/login', '/admin-login', '/student-teacher-login'];

      if (loginPaths.includes(currentPath)) {
        console.log(' NavigationGuard: Redirecting authenticated user from login page');

        // Get user info from localStorage or auth context
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};

        // Use React Router navigate without replace to allow normal back navigation
        if (user.role === 'admin') {
          navigate('/admindashboard');
        } else {
          navigate('/app');
        }
      }
    }
  }, [isAuthenticated, loading, location, navigate]);

  return children;
};

const AppWatermark = () => {
  const location = useLocation();

  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-10 select-none">
      <div className="rounded-2xl bg-white/45 backdrop-blur-[2px] p-2 shadow-sm">
        <img
          src="/logo.png"
          alt="TRCAC watermark"
          className="h-16 w-16 sm:h-20 sm:w-20 object-contain opacity-25"
        />
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<HomePage />} />

      {/* Login Routes - Protected by NavigationGuard */}
      <Route path="/login" element={<StudentTeacherLogin />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/student-teacher-login" element={<StudentTeacherLogin />} />

        <Route
          path='/queries'
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <LectureQueries />
            </ProtectedRoute>
          }
        />
      {/* Admin Create User - Admin Only */}
      <Route
        path="/admin-create-user"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCreateUser />
          </ProtectedRoute>
        }
      />

      {/* Bulk Enrollment - Admin Only */}
      <Route
        path="/admindashboard/bulk-enrollment"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BulkEnrollment />
          </ProtectedRoute>
        }
      />

      {/* Bulk Subjects - Admin Only */}
      <Route
        path="/admindashboard/bulk-subjects"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BulkSubjectEnrollment />
          </ProtectedRoute>
        }
      />

      {/* App Route - redirects based on role */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            {user?.role === 'teacher' ? (
              <Navigate to="/teacherdashboard" replace />
            ) : (
              <Navigate to="/studentdashboard" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Student Dashboard */}
      <Route
        path="/studentdashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="lectures" element={<StudentLectures />} />
        <Route path="assignment" element={<StudentAssignment />} />
        <Route path="assignment/submit/:assignmentId" element={<StudentSubmitAssignment />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="exams" element={<Exams />} />
        <Route path="lecture-history" element={<LectureHistory />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="query-updates" element={<QueryUpdates />} />
      </Route>

      <Route path="/student/quiz/:examId" element={<QuizAttempt />} />

      {/* Teacher Dashboard */}
      <Route
        path="/teacherdashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHome />} />
        <Route path="lectures" element={<TeacherLectures />} />
        <Route path="assignment" element={<TeacherAssignment />} />
        <Route path="exams" element={<TeacherExams />} />
        <Route path="activity" element={<AllActivity />} />
      </Route>
      <Route
        path="/teacher/quiz-results/:examId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <QuizResults />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admindashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="lectures" element={<AdminLectures />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="credentials" element={<AdminCredentials />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="addlectures" element={<AdminAddLecture />} />
        <Route path="addsubjects" element={<AdminAddSubjects />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};



const App = () => {
  return (
    <Router>
      <AuthProvider>
        <NavigationGuard>
          <AppWatermark />
          <AppRoutes />
        </NavigationGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
