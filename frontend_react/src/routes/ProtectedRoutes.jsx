// SHARED - may be replaced by team version
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoutes({ allowedRoles, children }) {
  return children;
}
