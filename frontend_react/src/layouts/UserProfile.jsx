import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiBriefcase,
  FiMapPin,
  FiEdit3,
  FiLock,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiFileText,
  FiUsers,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "PS";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Header = ({ title, subtitle }) => (
  <div>
    <h1>{title || "My Profile"}</h1>
    <p>{subtitle || "Manage your account information and super user details."}</p>
  </div>
);

const ProfileInfoCard = ({ profileData, onEdit, currentRole }) => {
  const fields = [
    { label: "Full Name", icon: <FiUser />, value: profileData.fullName },
    { label: "Email Address", icon: <FiMail />, value: profileData.email },
    { label: "Phone Number", icon: <FiPhone />, value: profileData.phone },
    { label: "Role", icon: <FiShield />, value: profileData.role, isBadge: true },
    {
      label: currentRole === "owner" ? "Flat / Unit" : "Department",
      icon: <FiBriefcase />,
      value: profileData.department,
    },
    { label: "Location", icon: <FiMapPin />, value: profileData.location },
  ];

  return (
    <div className="card">
      <div className="card_header">
        <h2>Profile Information</h2>
        <button type="button" className="btn_blue" onClick={onEdit}>
          <FiEdit3 />
          Edit Profile
        </button>
      </div>

      <div className="profile_info">
        <div className="avatar_col">
          <div className="avatar_circle">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={profileData.fullName}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              profileData.initials || getInitials(profileData.fullName)
            )}
          </div>
          {profileData.id && (
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              {profileData.idLabel || "ID"}: {profileData.id}
            </div>
          )}
        </div>

        <div className="details_grid">
          {fields.map((f, i) => (
            <div className="detail_item" key={i}>
              <div className="detail_label">
                {f.icon}
                <span>{f.label}</span>
              </div>
              {f.isBadge ? (
                <div>
                  <span className="role_badge">{f.value || "User"}</span>
                </div>
              ) : (
                <div className="detail_value">{f.value || "—"}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SummarySection = ({ title, subtitle, items }) => {
  if (!items || items.every((item) => item.value === undefined)) return null;
  return (
    <div className="card">
      <div className="card_header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="stats_grid">
        {items.map(
          (item, idx) =>
            item.value !== undefined && (
              <div className="stat_card" key={idx}>
                {item.icon}
                <div className="stat_content">
                  <span className="stat_value">{item.value}</span>
                  <span className="stat_label">{item.label}</span>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

const PasswordCard = ({ onOpen }) => (
  <div className="card password_card">
    <div className="password_header">
      <div className="password_icon">
        <FiLock size={20} />
      </div>
      <div>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Change Password</h2>
        <p>Update your account password</p>
      </div>
    </div>
    <button type="button" className="btn_blue" onClick={onOpen}>
      Update Password
    </button>
  </div>
);

const EditModal = ({ isOpen, onClose, currentRole, profileData, onSave }) => {
  if (!isOpen) return null;
  const [form, setForm] = useState({ ...profileData });

  const fields = [
    { label: "Full Name", key: "fullName", type: "text", required: true },
    { label: "Email Address", key: "email", type: "email", required: true },
    { label: "Phone Number", key: "phone", type: "tel", required: true },
    {
      label: currentRole === "owner" ? "Flat / Unit" : "Department",
      key: "department",
      type: "text",
    },
    { label: "Location", key: "location", type: "text" },
  ];

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal_box" onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h2>Edit Profile Information</h2>
          <span style={{ cursor: "pointer" }} onClick={onClose}>
            <FiX size={20} />
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="modal_form"
        >
          {fields.map((f, i) => (
            <div className="form_group" key={i}>
              <label>{f.label}</label>
              <input
                type={f.type}
                required={f.required}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="modal_actions">
            <button type="button" className="btn_cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn_blue">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordModal = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.currentPassword) return setError("Please enter your current password.");
    if (!form.newPassword) return setError("Please enter a new password.");
    if (form.newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("New passwords do not match.");
    onSave(form);
  };

  const fields = [
    { label: "Current Password", key: "currentPassword", placeholder: "Enter current password" },
    { label: "New Password", key: "newPassword", placeholder: "Enter new password" },
    { label: "Confirm New Password", key: "confirmPassword", placeholder: "Re-enter new password" },
  ];

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div className="modal_box" onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h2>Change Account Password</h2>
          <span style={{ cursor: "pointer" }} onClick={onClose}>
            <FiX size={20} />
          </span>
        </div>
        <form onSubmit={handleSubmit} className="modal_form">
          {error && <div style={{ color: "red", fontSize: "0.85rem" }}>{error}</div>}
          {fields.map((f, i) => (
            <div className="form_group" key={i}>
              <label>{f.label}</label>
              <input
                type="password"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="modal_actions">
            <button type="button" className="btn_cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn_blue">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function UserProfile({
  user,
  role,
  title = "My Profile",
  subtitle,
  performanceSummary,
  activitySummary,
  onUpdateProfile,
  onChangePassword,
}) {
  const normalizedRole = (role || user?.role || "").toLowerCase().replace(/\s+/g, "_");

  const currentRole = normalizedRole.includes("service")
    ? "service_provider"
    : normalizedRole.includes("maintain") || normalizedRole.includes("maintenance")
      ? "maintenance_manager"
      : normalizedRole.includes("owner")
        ? "owner"
        : "admin";

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    initials: user?.initials || getInitials(user?.fullName || ""),
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || role || "",
    id: user?.id || user?.employeeId || "",
    idLabel: user?.idLabel || "User ID",
    department: user?.department || "",
    location: user?.location || "",
    avatarUrl: user?.avatarUrl || null,
  });

  useEffect(() => {
    setProfileData({
      fullName: user?.fullName || "",
      initials: user?.initials || getInitials(user?.fullName || ""),
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || role || "",
      id: user?.id || user?.employeeId || "",
      idLabel: user?.idLabel || "User ID",
      department: user?.department || "",
      location: user?.location || "",
      avatarUrl: user?.avatarUrl || null,
    });
  }, [user, role]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleSaveProfile = (updated) => {
    const initials = updated.initials || getInitials(updated.fullName);
    const fullUpdated = { ...updated, initials };
    setProfileData(fullUpdated);
    setIsEditModalOpen(false);
    if (onUpdateProfile) onUpdateProfile(fullUpdated);
  };

  const handleSavePassword = (data) => {
    setIsPasswordModalOpen(false);
    if (onChangePassword) onChangePassword(data);
  };

  return (
    <div className="profile_cont">
      <div className="profile_divs">
        <Header title={title} subtitle={subtitle || user?.subtitle} />

        <ProfileInfoCard
          profileData={profileData}
          currentRole={currentRole}
          onEdit={() => setIsEditModalOpen(true)}
        />

        {currentRole === "service_provider" && performanceSummary && (
          <SummarySection
            title="Performance Summary"
            subtitle="Overview of your service ratings and task completion metrics"
            items={[
              { icon: <FiStar color="#d97706" size={24} />, label: "Average Rating", value: performanceSummary.averageRating },
              { icon: <FiCheckCircle color="#16a34a" size={24} />, label: "Completed Tasks", value: performanceSummary.completedTasks },
              { icon: <FiClock color="#2563eb" size={24} />, label: "Active Tasks", value: performanceSummary.activeTasks },
              { icon: <FiTrendingUp color="#9333ea" size={24} />, label: "Success Rate", value: performanceSummary.successRate },
            ]}
          />
        )}

        {currentRole === "maintenance_manager" && activitySummary && (
          <SummarySection
            title="Activity Summary"
            subtitle="Overview of society complaints and service provider allocations"
            items={[
              { icon: <FiFileText color="#4f46e5" size={24} />, label: "Total Complaints", value: activitySummary.totalComplaints },
              { icon: <FiCheckCircle color="#16a34a" size={24} />, label: "Resolved Complaints", value: activitySummary.resolvedComplaints },
              { icon: <FiUsers color="#2563eb" size={24} />, label: "Service Providers", value: activitySummary.serviceProviderCount },
              { icon: <FiAlertCircle color="#d97706" size={24} />, label: "Pending Complaints", value: activitySummary.pendingComplaints },
            ]}
          />
        )}

        <PasswordCard onOpen={() => setIsPasswordModalOpen(true)} />
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentRole={currentRole}
        profileData={profileData}
        onSave={handleSaveProfile}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
      />
    </div>
  );
}

export default UserProfile;
