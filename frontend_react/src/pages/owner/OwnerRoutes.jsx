import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OwnerProvider } from '../../context/OwnerContext';
import Dashboard from './Dashboard';
import NewComplaint from './NewComplaint';
import ComplaintDetails from './ComplaintDetails';
import PaymentHistory from './PaymentHistory';
import Alerts from './Alerts';
import Profile from './profile';

export default function OwnerRoutes() {
  return (
    <OwnerProvider>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-complaint" element={<NewComplaint />} />
        <Route path="complaint/:id" element={<ComplaintDetails />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </OwnerProvider>
  );
}
