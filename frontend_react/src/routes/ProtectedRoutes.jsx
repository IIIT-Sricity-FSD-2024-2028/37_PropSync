// SHARED - may be replaced by team version
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoutes({ allowedRoles, children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const role = String(currentUser.role || "").toLowerCase();
  const acceptedRoles = (allowedRoles || []).map((value) => String(value).toLowerCase());
  if (acceptedRoles.length && !acceptedRoles.includes(role)) {
    const destinations = {
      owner: "/owner/dashboard",
      maintenance_manager: "/maintenance_manager/dashboard",
      manager: "/maintenance_manager/dashboard",
      service_provider: "/service-provider/dashboard",
      admin: "/admin/dashboard",
      administrator: "/admin/dashboard",
      super_user: "/super_user/dashboard",
    };
    return <Navigate to={destinations[role] || "/"} replace />;
  }

  return children;
}
