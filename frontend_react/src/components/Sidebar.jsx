import {
  FiHome,
  FiClipboard,
  FiCreditCard,
  FiBell,
  FiUser,
  FiStar,
  FiFileText,
  FiCheckSquare,
  FiLogOut,
} from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi2";
import { GrDocumentPdf } from "react-icons/gr";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar({ role, menu, setMenu }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const roleOptions = {
    owner: [
      { name: "Dashboard", icon: <FiHome />, href: "/owner/dashboard" },
      { name: "New Complaint", icon: <FiClipboard />, href: "/owner/new-complaint" },
      {
        name: "Payment History",
        icon: <FiCreditCard />,
        href: "/owner/payment-history",
      },
      {
        name: "Alerts & Notifications",
        icon: <FiBell />,
        href: "/owner/alerts",
      },
      { name: "Profile", icon: <FiUser />, href: "/owner/profile" },
    ],
    service_provider: [
      { name: "Dashboard", icon: <FiHome />, href: "/service-provider/dashboard" },
      {
        name: "Available Complaints",
        icon: <FiFileText />,
        href: "/service-provider/available-complaints",
      },      {
        name: "Assigned Tasks",
        icon: <FiCheckSquare />,
        href: "/service-provider/assigned-tasks",
      },
      { name: "Ratings & Feedback", icon: <FiStar />, href: "/service-provider/ratings" },
      { name: "Notifications", icon: <FiBell />, href: "/service-provider/notifications" },
      { name: "Profile", icon: <FiUser />, href: "/service-provider/profile" },

    ],
    maintenance_manager: [
      { name: "Dashboard", icon: <FiHome />, href: "/dashboard" },
      { name: "Complaints", icon: <FiFileText />, href: "/complaints" },
      {
        name: "Service Estimate",
        icon: <GrDocumentPdf />,
        href: "/service-estimate",
      },
      {
        name: "Payment History",
        icon: <FiCreditCard />,
        href: "/payment-history",
      },
      {
        name: "Provider Performance",
        icon: <FiStar />,
        href: "/provider-performance",
      },
      {
        name: "Alerts & Notifications",
        icon: <FiBell />,
        href: "/notifications",
      },
      { name: "Profile", icon: <FiUser />, href: "/profile" },
    ],
    admin: [
      { name: "Dashboard", icon: <FiHome />, href: "/admin/dashboard" },
      {
        name: "Manage Participants",
        icon: <HiOutlineUsers />,
        href: "/admin/participants",
      },
      { name: "Complaints", icon: <FiFileText />, href: "/admin/complaints" },
      { name: "Notifications", icon: <FiBell />, href: "/admin/notifications" },
      { name: "Profile", icon: <FiUser />, href: "/admin/profile" },
    ],
    super_user: [
      { name: "Dashboard", icon: <FiHome />, href: "/super_user/dashboard" },
      { name: "Manage Participants", icon: <HiOutlineUsers />, href: "/super_user/participants" },
      { name: "Complaints", icon: <FiFileText />, href: "/super_user/complaints" },
      { name: "Notifications", icon: <FiBell />, href: "/super_user/notifications" },
      { name: "Roles", icon: <FiUser />, href: "/super_user/roles" },
      { name: "Revenue", icon: <FiCreditCard />, href: "/super_user/revenue" },
      { name: "Profile", icon: <FiUser />, href: "/super_user/profile" },
    ],
  };
  const options = roleOptions[role] || [];
  return (
    <div className="sidebar-overlay" onClick={() => setMenu(false)}>
      <div className="sideBar" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="side_cont">
            <img src="/logo.png" alt="PropSync" height="40px" />
            <span id="closeBtn" onClick={() => setMenu(!menu)}>
              ✖
            </span>
          </div>
          <div className="optionCont">
            {options.map((r) => (
              <NavLink key={r.href} to={r.href} onClick={() => setMenu(false)} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} end>
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
        <div>
          <button className="logout" type="button" onClick={() => { logout(); navigate("/", { replace: true }); }}>
            <FiLogOut aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
