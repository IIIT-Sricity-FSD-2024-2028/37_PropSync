import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// Login
import LoginSignup from "../pages/LoginSignup";

// Owner
import ProtectedRoute from "./ProtectedRoutes";
import OwnerRoutes from "../pages/owner/OwnerRoutes";

// Administrator
import AdministratorDashboard from "../pages/administrator/Dashboard";
import AdministratorParticipants from "../pages/administrator/Participants";
import AdministratorComplaints from "../pages/administrator/Complaints";
import AdministratorNotifications from "../pages/administrator/Notifications";

// Super User
import SuperUserDashboard from "../pages/super_user/Dashboard";
import SuperUserParticipants from "../pages/super_user/Participants";
import SuperUserComplaints from "../pages/super_user/Complaints";
import SuperUserNotifications from "../pages/super_user/Notifications";
import SuperUserRoles from "../pages/super_user/Roles";
import SuperUserRevenue from "../pages/super_user/Revenue";

// Service Provider
import AvailableComplaints from "../pages/service_provider/AvailableComplaints.jsx";
import ServiceProviderDashboard from "../pages/service_provider/Dashboard.jsx";
import AssignedTasks from "../pages/service_provider/AssignedTasks.jsx";
import TaskDetails from "../pages/service_provider/TaskDetails.jsx";
import SubmitEstimate from "../pages/service_provider/SubmitEstimate.jsx";
import UpdateStatus from "../pages/service_provider/UpdateStatus.jsx";
import Ratings from "../pages/service_provider/Ratings.jsx";

// Current user's role
function getCurrentRole() {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser") || "{}").role || ""
    ).toLowerCase();
  } catch {
    return "";
  }
}

// Redirect legacy routes according to the current role
function LegacyRoleRoute() {
  const { pathname } = useLocation();
  const role = getCurrentRole();
  const page = pathname.replace(/^\/+/, "");

  const prefixes = {
    admin: "/admin",
    administrator: "/admin",
    super_user: "/super_user",
    "service_provider": "/service-provider",
    "service-provider": "/service-provider",
    owner: "/owner",
  };

  const prefix = prefixes[role];

  if (!prefix) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`${prefix}/${page}`} replace />;
}

// Redirect legacy Super User URLs
function LegacySuperUserRoute() {
  const { pathname } = useLocation();
  const page = pathname.replace(/^\/super-user\/?/, "");

  const validPages = [
    "dashboard",
    "participants",
    "complaints",
    "notifications",
    "roles",
    "revenue",
  ];

  if (!validPages.includes(page)) {
    return <Navigate to="/super_user/dashboard" replace />;
  }

  return <Navigate to={`/super_user/${page}`} replace />;
}

// Application routes
function AppRouteDefinitions() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<LoginSignup />} />
      <Route path="/login" element={<LoginSignup />} />

      {/* Owner aliases */}
      <Route
        path="/dashboard"
        element={<LegacyRoleRoute />}
      />
      <Route
        path="/new-complaint"
        element={<Navigate to="/owner/new-complaint" replace />}
      />
      <Route
        path="/payment-history"
        element={<Navigate to="/owner/payment-history" replace />}
      />
      <Route
        path="/alerts"
        element={<Navigate to="/owner/alerts" replace />}
      />
      <Route
        path="/profile"
        element={<Navigate to="/owner/profile" replace />}
      />
      <Route
        path="/alerts.html"
        element={<Navigate to="/owner/alerts" replace />}
      />
      <Route
        path="/profile.html"
        element={<Navigate to="/owner/profile" replace />}
      />
      <Route
        path="/owner/profile.html"
        element={<Navigate to="/owner/profile" replace />}
      />
      <Route
        path="/owner/alerts.html"
        element={<Navigate to="/owner/alerts" replace />}
      />

      {/* Protected Owner pages */}
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerRoutes />
          </ProtectedRoute>
        }
      />

      {/* Administrator */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/index.html"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={<AdministratorDashboard />}
      />
      <Route
        path="/admin/participants"
        element={<AdministratorParticipants />}
      />
      <Route
        path="/admin/complaints"
        element={<AdministratorComplaints />}
      />
      <Route
        path="/admin/notifications"
        element={<AdministratorNotifications />}
      />

      {/* Administrator aliases */}
      <Route
        path="/administrator"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/administrator/dashboard"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/administrator/participants"
        element={<Navigate to="/admin/participants" replace />}
      />
      <Route
        path="/administrator/complaints"
        element={<Navigate to="/admin/complaints" replace />}
      />
      <Route
        path="/administrator/notifications"
        element={<Navigate to="/admin/notifications" replace />}
      />

      {/* Super User */}
      <Route
        path="/super_user"
        element={<Navigate to="/super_user/dashboard" replace />}
      />
      <Route
        path="/super_user/index.html"
        element={<Navigate to="/super_user/dashboard" replace />}
      />
      <Route
        path="/super_user/dashboard"
        element={<SuperUserDashboard />}
      />
      <Route
        path="/super_user/participants"
        element={<SuperUserParticipants />}
      />
      <Route
        path="/super_user/complaints"
        element={<SuperUserComplaints />}
      />
      <Route
        path="/super_user/notifications"
        element={<SuperUserNotifications />}
      />
      <Route
        path="/super_user/roles"
        element={<SuperUserRoles />}
      />
      <Route
        path="/super_user/revenue"
        element={<SuperUserRevenue />}
      />

      {/* Super User aliases */}
      <Route
        path="/super-user"
        element={<Navigate to="/super_user/dashboard" replace />}
      />
      <Route
        path="/super-user/*"
        element={<LegacySuperUserRoute />}
      />

      {/* Service Provider */}
      <Route
        path="/service-provider"
        element={<Navigate to="/service-provider/dashboard" replace />}
      />
      <Route
        path="/service-provider/dashboard"
        element={<ServiceProviderDashboard />}
      />
      <Route
        path="/service-provider/available-complaints"
        element={<AvailableComplaints />}
      />
      <Route
        path="/service-provider/assigned-tasks"
        element={<AssignedTasks />}
      />
      <Route
        path="/service-provider/task-details"
        element={<TaskDetails />}
      />
      <Route
        path="/service-provider/submit-estimate"
        element={<SubmitEstimate />}
      />
      <Route
        path="/service-provider/update-status"
        element={<UpdateStatus />}
      />
      <Route
        path="/service-provider/ratings"
        element={<Ratings />}
      />

      {/* Legacy role-based routes */}
      <Route path="/participants" element={<LegacyRoleRoute />} />
      <Route path="/complaints" element={<LegacyRoleRoute />} />
      <Route path="/notifications" element={<LegacyRoleRoute />} />

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

// Keep BrowserRouter in this file only if main.jsx does not already provide it.
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRouteDefinitions />
    </BrowserRouter>
  );
}