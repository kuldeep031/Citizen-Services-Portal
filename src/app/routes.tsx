import { createBrowserRouter, Navigate } from 'react-router';
import { PublicLayout } from './components/PublicLayout';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ComplaintSubmission } from './pages/ComplaintSubmission';
import { ApplicationTracking } from './pages/ApplicationTracking';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminComplaints } from './pages/AdminComplaints';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: (
      <PublicOnlyRoute>
        <PublicLayout />
      </PublicOnlyRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
    path: '/track',
    element: <PublicLayout />,
    children: [
      { index: true, element: <ApplicationTracking /> },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },

  // Citizen protected routes
  {
    path: '/citizen',
    element: (
      <ProtectedRoute allowedRoles={['citizen']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CitizenDashboard /> },
      { path: 'submit-complaint', element: <ComplaintSubmission /> },
      { path: 'track-application', element: <ApplicationTracking /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },

  // Officer protected routes
  {
    path: '/officer',
    element: (
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OfficerDashboard /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },

  // Admin protected routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'complaints', element: <AdminComplaints /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);
