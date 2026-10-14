import React from "react";
import { Navigate } from "react-router-dom";
import { ToastProvider } from "./Toast";

// Maintenance Manager only: login + role check, and toast messages.
export const MANAGER_ROLES = ["maintenance_manager", "manager"];

export function isManager() {
  try {
    const role = (JSON.parse(localStorage.getItem("currentUser") || "{}").role || "").toLowerCase();
    return MANAGER_ROLES.includes(role);
  } catch {
    return false;
  }
}

export default function ManagerGuard({ children }) {
  if (!isManager()) return <Navigate to="/login" replace />;
  return <ToastProvider>{children}</ToastProvider>;
}
