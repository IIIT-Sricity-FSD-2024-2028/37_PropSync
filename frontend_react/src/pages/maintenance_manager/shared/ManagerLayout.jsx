import React from "react";
import Navbar from "../../../components/Navbar"; // COMMON COMPONENT (Navbar + Sidebar)
import BackLink from "./BackLink";
import { getCurrentManager } from "../../../services/managerService";
import "./maintenance_manager.css";

/* Name shown in the Navbar (profile edits are saved under mmProfile:<email>) */
export function getManagerName() {
  const user = getCurrentManager();
  try {
    const saved = JSON.parse(localStorage.getItem(`mmProfile:${user.email}`)) || {};
    return saved.fullName || user.name || "Maintenance Manager";
  } catch {
    return user.name || "Maintenance Manager";
  }
}

/* Page wrapper used by every manager page:
   common Navbar on top + the green-grey content area. */
export default function ManagerLayout({ children, backTo, backLabel }) {
  return (
    <>
      <Navbar name={getManagerName()} role="maintenance_manager" />
      <div className="mm-page">
        {backTo && <BackLink to={backTo} label={backLabel} />}
        {children}
      </div>
    </>
  );
}
