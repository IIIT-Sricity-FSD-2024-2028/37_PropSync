import {
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
import ComplaintDetails from "../layouts/ComplaintDetails.jsx";
import Notifications from "../layouts/Notifications.jsx";
import RoleLayout from "../components/RoleLayout";
import RoleProfilePage from "../layouts/RoleProfilePage";

// Maintenance Manager
import ManagerGuard, { isManager } from "../pages/maintenance_manager/shared/ManagerGuard";
import MMDashboard from "../pages/maintenance_manager/Dashboard/Dashboard";
import MMComplaints from "../pages/maintenance_manager/Complaints/Complaints";
import MMComplaintDetails from "../pages/maintenance_manager/ComplaintDetails/ComplaintDetails";
import MMAssignProvider from "../pages/maintenance_manager/AssignProvider/AssignProvider";
import MMServiceEstimate from "../pages/maintenance_manager/ServiceEstimate/ServiceEstimate";
import MMPaymentHistory from "../pages/maintenance_manager/PaymentHistory/PaymentHistory";
import MMMaintenance from "../pages/maintenance_manager/Maintenance/Maintenance";
import MMProviderPerformance from "../pages/maintenance_manager/ProviderPerformance/ProviderPerformance";
import MMNotifications from "../pages/maintenance_manager/Notifications/Notifications";
import MMProfile from "../pages/maintenance_manager/Profile/Profile";

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
    maintenance_manager: "/maintenance_manager",
    manager: "/maintenance_manager",
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
    "profile",
  ];

  if (!validPages.includes(page)) {
    return <Navigate to="/super_user/dashboard" replace />;
  }

  return <Navigate to={`/super_user/${page}`} replace />;
}

// Shared Sidebar link: Maintenance Manager -> its own page, everyone else -> same as before
function ManagerOr({ page, to }) {
  if (isManager()) {
    return <Navigate to={`/maintenance_manager/${page}`} replace />;
  }
  return <Navigate to={to} replace />;
}

function ServiceProviderPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={["service_provider"]}>
      <RoleLayout role="service_provider">{children}</RoleLayout>
    </ProtectedRoute>
  );
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
        element={<ManagerOr page="payment-history" to="/owner/payment-history" />}
      />
      <Route
        path="/alerts"
        element={<Navigate to="/owner/alerts" replace />}
      />
      <Route
        path="/profile"
        element={<ManagerOr page="profile" to="/owner/profile" />}
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
        element={<ProtectedRoute allowedRoles={["admin", "administrator"]}><RoleLayout role="admin"><AdministratorDashboard /></RoleLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/participants"
        element={<ProtectedRoute allowedRoles={["admin", "administrator"]}><RoleLayout role="admin"><AdministratorParticipants /></RoleLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/complaints"
        element={<ProtectedRoute allowedRoles={["admin", "administrator"]}><RoleLayout role="admin"><AdministratorComplaints /></RoleLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/notifications"
        element={<ProtectedRoute allowedRoles={["admin", "administrator"]}><RoleLayout role="admin"><AdministratorNotifications /></RoleLayout></ProtectedRoute>}
      />
      <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={["admin", "administrator"]}><RoleLayout role="admin"><RoleProfilePage role="admin" /></RoleLayout></ProtectedRoute>} />

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
      <Route path="/administrator/profile" element={<Navigate to="/admin/profile" replace />} />

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
        element={<RoleLayout role="super_user"><SuperUserDashboard /></RoleLayout>}
      />
      <Route
        path="/super_user/participants"
        element={<RoleLayout role="super_user"><SuperUserParticipants /></RoleLayout>}
      />
      <Route
        path="/super_user/complaints"
        element={<RoleLayout role="super_user"><SuperUserComplaints /></RoleLayout>}
      />
      <Route
        path="/super_user/notifications"
        element={<RoleLayout role="super_user"><SuperUserNotifications /></RoleLayout>}
      />
      <Route
        path="/super_user/roles"
        element={<RoleLayout role="super_user"><SuperUserRoles /></RoleLayout>}
      />
      <Route
        path="/super_user/revenue"
        element={<RoleLayout role="super_user"><SuperUserRevenue /></RoleLayout>}
      />
      <Route path="/super_user/profile" element={<RoleLayout role="super_user"><RoleProfilePage role="super_user" /></RoleLayout>} />

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
      <Route path="/service_provider/index.html" element={<Navigate to="/service-provider/dashboard" replace />} />
      <Route
        path="/service-provider/dashboard"
        element={<ServiceProviderPage><ServiceProviderDashboard /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/available-complaints"
        element={<ServiceProviderPage><AvailableComplaints /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/assigned-tasks"
        element={<ServiceProviderPage><AssignedTasks /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/task-details"
        element={<ServiceProviderPage><TaskDetails /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/submit-estimate"
        element={<ServiceProviderPage><SubmitEstimate /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/update-status"
        element={<ServiceProviderPage><UpdateStatus /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/ratings"
        element={<ServiceProviderPage><Ratings /></ServiceProviderPage>}
      />
      <Route
        path="/service-provider/profile"
        element={<ServiceProviderPage><RoleProfilePage role="service_provider" /></ServiceProviderPage>}
      />
      <Route path="/service-provider/notifications" element={<ProtectedRoute allowedRoles={["service_provider"]}><Notifications role="service_provider" /></ProtectedRoute>} />

      {/* Maintenance Manager */}
      <Route
        path="/maintenance_manager"
        element={<Navigate to="/maintenance_manager/dashboard" replace />}
      />
      <Route
        path="/maintenance_manager/dashboard.html"
        element={<Navigate to="/maintenance_manager/dashboard" replace />}
      />
      <Route path="/maintenance_manager/dashboard" element={<ManagerGuard><MMDashboard /></ManagerGuard>} />
      <Route path="/maintenance_manager/complaints" element={<ManagerGuard><MMComplaints /></ManagerGuard>} />
      <Route path="/maintenance_manager/complaint-details" element={<ManagerGuard><MMComplaintDetails /></ManagerGuard>} />
      <Route path="/maintenance_manager/assign-provider" element={<ManagerGuard><MMAssignProvider /></ManagerGuard>} />
      <Route path="/maintenance_manager/service-estimate" element={<ManagerGuard><MMServiceEstimate /></ManagerGuard>} />
      <Route path="/maintenance_manager/payment-history" element={<ManagerGuard><MMPaymentHistory /></ManagerGuard>} />
      <Route path="/maintenance_manager/maintenance" element={<ManagerGuard><MMMaintenance /></ManagerGuard>} />
      <Route path="/maintenance_manager/provider-performance" element={<ManagerGuard><MMProviderPerformance /></ManagerGuard>} />
      <Route path="/maintenance_manager/notifications" element={<ManagerGuard><MMNotifications /></ManagerGuard>} />
      <Route path="/maintenance_manager/profile" element={<ManagerGuard><MMProfile /></ManagerGuard>} />
      {/* Navbar bell / avatar links ("./alerts.html", "./profile.html") */}
      <Route
        path="/maintenance_manager/alerts.html"
        element={<Navigate to="/maintenance_manager/notifications" replace />}
      />
      <Route
        path="/maintenance_manager/profile.html"
        element={<Navigate to="/maintenance_manager/profile" replace />}
      />

      {/* Legacy role-based routes */}
      <Route path="/participants" element={<LegacyRoleRoute />} />
      <Route path="/complaints" element={<LegacyRoleRoute />} />
      <Route path="/complaint-details" element={<ComplaintDetails />} />
      <Route path="/complaint-details/:id" element={<ComplaintDetails />} />
      <Route path="/complaints/:id" element={<ComplaintDetails />} />
      <Route path="/notifications" element={<LegacyRoleRoute />} />
      <Route path="/provider-performance" element={<LegacyRoleRoute />} />

      {/* Fallback */}
      <Route path="*" element={<main style={{ padding: "2rem" }}><h1>Page not found</h1><p>The requested PropSync page does not exist.</p><a href="/">Return to login</a></main>} />
    </Routes>
  );
}

// BrowserRouter + AuthProvider are already in App.jsx, so no second BrowserRouter here.
export default function AppRoutes() {
  return <AppRouteDefinitions />;
}
