// Owner Module Routes
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoutes';
import OwnerRoutes from '../pages/owner/OwnerRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect to Owner Dashboard */}
      <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/owner/dashboard" replace />} />

      {/* Aliases for Sidebar.jsx links */}
      <Route path="/dashboard" element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="/new-complaint" element={<Navigate to="/owner/new-complaint" replace />} />
      <Route path="/payment-history" element={<Navigate to="/owner/payment-history" replace />} />
      <Route path="/notifications" element={<Navigate to="/owner/alerts" replace />} />
      <Route path="/profile" element={<Navigate to="/owner/profile" replace />} />
      <Route path="/alerts" element={<Navigate to="/owner/alerts" replace />} />

      {/* Aliases for Navbar.jsx links */}
      <Route path="/alerts.html" element={<Navigate to="/owner/alerts" replace />} />
      <Route path="/profile.html" element={<Navigate to="/owner/profile" replace />} />
      <Route path="/owner/profile.html" element={<Navigate to="/owner/profile" replace />} />
      <Route path="/owner/alerts.html" element={<Navigate to="/owner/alerts" replace />} />

      {/* Owner Protected Routes */}
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerRoutes />
          </ProtectedRoute>
        }
      />

      {/* Fallback to Owner Dashboard */}
      <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
    </Routes>
  );
}

