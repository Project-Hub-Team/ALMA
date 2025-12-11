import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VoucherRegistration from './pages/auth/VoucherRegistration';

// Dashboard Pages
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Admin Pages
import { Students } from './pages/admin/Students';
import { Teachers } from './pages/admin/Teachers';
import { Classes } from './pages/admin/Classes';
import { Fees } from './pages/admin/Fees';
import Reports from './pages/admin/Reports';

// Teacher Pages
import { Attendance } from './pages/teacher/Attendance';
import { GradeEntry } from './pages/teacher/GradeEntry';
import { LessonNotes } from './pages/teacher/LessonNotes';
import { MyClasses } from './pages/teacher/MyClasses';
import { AttendanceHistory } from './pages/teacher/index';

// Student Pages
import MyResults from './pages/student/MyResults';
import MyFees from './pages/student/MyFees';
import MyLessonNotes from './pages/student/MyLessonNotes';
import MyAttendance from './pages/student/MyAttendance';

// Super Admin Pages
import SystemSettings from './pages/superadmin/SystemSettings';
import ManageAdmins from './pages/superadmin/ManageAdmins';
import Vouchers from './pages/superadmin/Vouchers';

import { USER_ROLES } from './constants/ghanaEducation';

function App() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!currentUser ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!currentUser ? <Register /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/forgot-password"
        element={!currentUser ? <ForgotPassword /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/voucher-registration"
        element={!currentUser ? <VoucherRegistration /> : <Navigate to="/dashboard" />}
      />

      {/* Dashboard Route - Redirects based on role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {userProfile?.role === USER_ROLES.SUPER_ADMIN && <SuperAdminDashboard />}
            {userProfile?.role === USER_ROLES.ADMIN && <AdminDashboard />}
            {userProfile?.role === USER_ROLES.TEACHER && <TeacherDashboard />}
            {userProfile?.role === USER_ROLES.STUDENT && <StudentDashboard />}
          </ProtectedRoute>
        }
      />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin/settings"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            <SystemSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/admins"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            <ManageAdmins />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/vouchers"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
            <Vouchers />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
            <Teachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
            <Classes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fees"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
            <Fees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
            <GradeEntry />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/lesson-notes"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
            <LessonNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/my-classes"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
            <MyClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance-history"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
            <AttendanceHistory />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
            <MyResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/fees"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
            <MyFees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/lesson-notes"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
            <MyLessonNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
            <MyAttendance />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="/"
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} />}
      />

      {/* 404 Not Found */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
