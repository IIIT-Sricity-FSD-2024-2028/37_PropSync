import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// Login
import LoginSignup from "../pages/LoginSignup";

// Administrator pages
import AdministratorDashboard from "../pages/administrator/Dashboard";
import AdministratorParticipants from "../pages/administrator/Participants";
import AdministratorComplaints from "../pages/administrator/Complaints";
import AdministratorNotifications from "../pages/administrator/Notifications";

// Super User pages
import SuperUserDashboard from "../pages/super_user/Dashboard";
import SuperUserParticipants from "../pages/super_user/Participants";
import SuperUserComplaints from "../pages/super_user/Complaints";
import SuperUserNotifications from "../pages/super_user/Notifications";
import SuperUserRoles from "../pages/super_user/Roles";
import SuperUserRevenue from "../pages/super_user/Revenue";

// Service Provider pages
import AvailableComplaints from "../pages/service_provider/AvailableComplaints.jsx";
import ServiceProviderDashboard from "../pages/service_provider/Dashboard.jsx";
import AssignedTasks from "../pages/service_provider/AssignedTasks.jsx";
import TaskDetails from "../pages/service_provider/TaskDetails.jsx";
import SubmitEstimate from "../pages/service_provider/SubmitEstimate.jsx";
import UpdateStatus from "../pages/service_provider/UpdateStatus.jsx";
import Ratings from "../pages/service_provider/Ratings.jsx";

// Get the current user's role
function getCurrentRole() {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser") || "{}").role || ""
    ).toLowerCase();
  } catch {
    return "";
  }
}

// Handle legacy URLs such as /dashboard
function LegacyRoleRoute() {
  const { pathname } = useLocation();
  const currentRole = getCurrentRole();

  const page = pathname.replace(/^\//, "");

  const prefixes = {
    admin: "/admin",
    administrator: "/admin",
    super_user: "/super_user",
    "service_provider": "/service-provider",
    "service-provider": "/service-provider",
  };

  const prefix = prefixes[currentRole];

  if (!prefix) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`${prefix}/${page}`} replace />;
}

// Main application routes
function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<LoginSignup />} />
      <Route path="/login" element={<LoginSignup />} />

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

      {/* Administrator legacy URL aliases */}
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

      {/* Super User legacy URL aliases */}
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

      {/* Legacy role-based URLs */}
      <Route path="/dashboard" element={<LegacyRoleRoute />} />
      <Route path="/participants" element={<LegacyRoleRoute />} />
      <Route path="/complaints" element={<LegacyRoleRoute />} />
      <Route path="/notifications" element={<LegacyRoleRoute />} />

      {/* Unknown URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Redirect old /super-user URLs to the canonical /super_user URLs
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

// Export one router entry point
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
