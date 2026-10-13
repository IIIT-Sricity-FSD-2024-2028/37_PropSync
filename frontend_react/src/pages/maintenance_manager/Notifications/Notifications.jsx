import React from "react";
import Notifications from "../../../layouts/Notifications"; // COMMON COMPONENT
import { getManagerName } from "../shared/ManagerLayout";
import { getManagerId } from "../../../services/managerService";

/**
 * Alerts & Notifications for the Maintenance Manager.
 * The shared Notifications layout already contains everything the old
 * notification.html had (Navbar, "Create & Send Notification" composer for
 * managers, filters, mark-read / delete / clear-all), so we only pass role + user.
 */
export default function ManagerNotifications() {
  return <Notifications role="maintenance_manager" userId={getManagerId()} name={getManagerName()} />;
}
