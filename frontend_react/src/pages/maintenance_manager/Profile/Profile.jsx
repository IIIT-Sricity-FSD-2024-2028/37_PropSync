import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar"; // COMMON COMPONENT
import UserProfile from "../../../layouts/UserProfile"; // COMMON COMPONENT
import { getManagerName } from "../shared/ManagerLayout";
import { useToast } from "../shared/Toast";
import {
  fetchComplaints,
  fetchProviders,
  getCurrentManager,
  updateManagerProfile,
} from "../../../services/managerService";

const RESOLVED = ["completed", "billed", "paid", "closed"];

/** Profile page = shared Navbar + shared UserProfile layout, fed with manager data */
export default function ManagerProfile() {
  const showToast = useToast();
  const current = getCurrentManager();
  const storageKey = `mmProfile:${current.email || "manager"}`;

  const [user, setUser] = useState(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      saved = {};
    }
    return {
      fullName: saved.fullName || current.name || "Vijay Singh",
      email: saved.email || current.email || "vijay.manager@propsync.com",
      phone: saved.phone || current.phone || "+91-9876543220",
      role: "Maintenance Manager",
      id: `Manager #${current.id || 5}`,
      idLabel: "Manager ID",
      department: saved.department || (current.block ? `Block ${current.block}` : "Maintenance"),
      location: saved.location || current.communityName || "Green Valley Society",
    };
  });
  const [navName, setNavName] = useState(getManagerName());
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    Promise.all([fetchComplaints(), fetchProviders().catch(() => [])])
      .then(([complaints, providers]) =>
        setActivity({
          totalComplaints: complaints.length,
          resolvedComplaints: complaints.filter((c) => RESOLVED.includes(c.status)).length,
          serviceProviderCount: providers.length,
          pendingComplaints: complaints.filter((c) => c.status === "pending").length,
        })
      )
      .catch(() => setActivity(null));
  }, []);

  const handleUpdate = async (updated) => {
    const next = { ...user, ...updated };
    setUser(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setNavName(next.fullName);
    try {
      await updateManagerProfile({ name: next.fullName, phone: next.phone });
      // keep the logged-in user in sync for the rest of the app
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...current, name: next.fullName, phone: next.phone })
      );
      showToast("Profile updated successfully.");
    } catch (e) {
      showToast("Saved locally, but the server update failed: " + e.message);
    }
  };

  const handlePassword = () => {
    // backend has no change-password endpoint yet
    showToast("Password change is not available yet (no backend endpoint).");
  };

  return (
    <div>
      <Navbar name={navName} role="maintenance_manager" />
      <UserProfile
        user={user}
        role="maintenance_manager"
        title="My Profile"
        subtitle="Manage your account details and maintenance activity."
        activitySummary={activity}
        onUpdateProfile={handleUpdate}
        onChangePassword={handlePassword}
      />
    </div>
  );
}
