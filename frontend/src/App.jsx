import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { CampusMapPage } from './pages/public/CampusMapPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CreateComplaint } from './pages/student/CreateComplaint';
import { MyComplaints } from './pages/student/MyComplaints';
import { ComplaintDetails } from './pages/student/ComplaintDetails';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { AssignedComplaints } from './pages/staff/AssignedComplaints';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllComplaints } from './pages/admin/AllComplaints';
import { UserManagement } from './pages/admin/UserManagement';
import { DepartmentManagement } from './pages/admin/DepartmentManagement';
import { BuildingManagement } from './pages/admin/BuildingManagement';
import { AnalyticsReports } from './pages/admin/AnalyticsReports';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-semibold text-slate-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default home for their role
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'STAFF') return <Navigate to="/department" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Public */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="map" element={<CampusMapPage />} />

            {/* Shared Complaint Detail View */}
            <Route
              path="complaints/:id"
              element={
                <ProtectedRoute>
                  <ComplaintDetails />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="create-complaint"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ADMIN']}>
                  <CreateComplaint />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-complaints"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ADMIN']}>
                  <MyComplaints />
                </ProtectedRoute>
              }
            />

            {/* Department Staff Routes */}
            <Route
              path="department"
              element={
                <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="department/complaints"
              element={
                <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                  <AssignedComplaints />
                </ProtectedRoute>
              }
            />

            {/* Administrator Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/complaints"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AllComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/map"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CampusMapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/departments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/buildings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BuildingManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AnalyticsReports />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
