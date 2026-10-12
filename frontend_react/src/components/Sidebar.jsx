import React, { useState } from "react";
import {
  FiHome,
  FiClipboard,
  FiCreditCard,
  FiBell,
  FiUser,
  FiStar,
  FiFileText,
  FiCheckSquare,
} from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi2";
import { GrDocumentPdf } from "react-icons/gr";

function Sidebar({ role, menu, setMenu }) {
  const roleOptions = {
    owner: [
      { name: "Dashboard", icon: <FiHome />, href: "/dashboard" },
      { name: "New Complaint", icon: <FiClipboard />, href: "/new-complaint" },
      {
        name: "Payment History",
        icon: <FiCreditCard />,
        href: "/payment-history",
      },
      {
        name: "Alerts & Notifications",
        icon: <FiBell />,
        href: "/notifications",
      },
      { name: "Profile", icon: <FiUser />, href: "/profile" },
    ],
    service_provider: [
      { name: "Dashboard", icon: <FiHome />, href: "/dashboard" },
      {
        name: "Available Complaints",
        icon: <FiFileText />,
        href: "/available-complaints",
      },
      { name: "Profile", icon: <FiUser />, href: "/profile" },
      {
        name: "Assigned Tasks",
        icon: <FiCheckSquare />,
        href: "/assigned-tasks",
      },
      { name: "Ratings & Feedback", icon: <FiStar />, href: "/ratings" },
      { name: "Notifications", icon: <FiBell />, href: "/notifications" },
    ],
    maintenance_manager: [
      { name: "Dashboard", icon: <FiHome />, href: "/dashboard" },
      { name: "Complaints", icon: <FiFileText />, href: "/complaints" },
      {
        name: "Service Estimate",
        icon: <GrDocumentPdf />,
        href: "/complaints",
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
      { name: "Dashboard", icon: <FiHome />, href: "/dashboard" },
      {
        name: "Manage Participants",
        icon: <HiOutlineUsers />,
        href: "/dashboard",
      },
      { name: "Complaints", icon: <FiFileText />, href: "/complaints" },
      { name: "Notifications", icon: <FiBell />, href: "/notifications" },
      { name: "Profile", icon: <FiUser />, href: "/profile" },
    ],
  };
  const [selected, setSelected] = useState("");
  return (
    <div className="sidebar-overlay" onClick={() => setMenu(false)}>
      <div className="sideBar" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="side_cont">
            <img src="logo.png" alt="" height="40px" />
            <span id="closeBtn" onClick={() => setMenu(!menu)}>
              ✖
            </span>
          </div>
          <div className="optionCont">
            {roleOptions[role].map((r) => (
              <a
                href={r.href}
                onClick={() => setSelected(r.name)}
                style={
                  selected == r.name
                    ? { backgroundColor: "#16a34a" }
                    : { backgroundColor: "white" }
                }
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <a className="logout" href="../login_signup.html">
            <p id="arrow">&rarr;</p>
            Logout
          </a>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
