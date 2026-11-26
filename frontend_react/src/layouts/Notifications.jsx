import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
  extractComplaintId,
  isComplaintRejected,
  isEstimateRejected,
  selectServiceProviderNotifications,
} from "../redux/features/notifications/notificationsSlice";
import "./Notifications.css";
import Navbar from "../components/Navbar";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiUserPlus,
  FiClock,
  FiTool,
  FiDollarSign,
  FiClipboard,
  FiAlertTriangle,
  FiCalendar,
  FiVolume2,
  FiUsers,
  FiHome,
  FiUser,
  FiSend,
  FiRotateCcw,
} from "react-icons/fi";
import { fetchUsers, selectUsers } from "../redux/features/users/usersSlice";

const ROLE_PROFILES = {
  admin: {
    userId: 13,
    title: "Notifications",
    subtitle: "View alerts and updates related to system activities and user management.",
    name: "Green Valley Administrator",
  },
  maintenance_manager: {
    userId: 5,
    title: "Alerts & Notifications",
    subtitle: "Send targeted notices and view maintenance updates.",
    name: "Vijay Singh",
  },
  service_provider: {
    userId: 10,
    title: "Notifications",
    subtitle: "View your assigned tasks, work orders, and payment updates.",
    name: "BrightSpark Electricals",
  },
  owner: {
    userId: 1,
    title: "Alerts & Notifications",
    subtitle: "Stay updated on your complaints, bills, and society announcements.",
    name: "Raj Kumar",
  },
};

const COMPOSER_TYPES = [
  { id: "Maintenance", title: "Maintenance", desc: "Work updates", icon: <FiTool color="#16a34a" />, apiType: "work_completed" },
  { id: "Payment", title: "Payment", desc: "Bills & Invoices", icon: <FiDollarSign color="#d97706" />, apiType: "payment_due" },
  { id: "Complaint", title: "Complaint", desc: "Status updates", icon: <FiClipboard color="#9333ea" />, apiType: "complaint_submitted" },
  { id: "Alert", title: "Alert", desc: "Urgent notices", icon: <FiAlertTriangle color="#ea580c" />, apiType: "overdue" },
  { id: "Schedule", title: "Schedule", desc: "Appointments", icon: <FiCalendar color="#2563eb" />, apiType: "provider_assigned" },
  { id: "General", title: "General", desc: "Announcements", icon: <FiVolume2 color="#e11d48" />, apiType: "custom" },
];

const AUDIENCE_OPTIONS = [
  { id: "all", label: "All Users", icon: <FiUsers /> },
  { id: "service_provider", label: "Service Provider", icon: <FiTool /> },
  { id: "owner", label: "Property Owner", icon: <FiHome /> },
  { id: "resident", label: "Resident", icon: <FiUser /> },
];

const formatTimeAgo = (dateStr) => {
  if (!dateStr || dateStr.includes?.("ago")) return dateStr || "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const elapsedSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hour${Math.floor(elapsedSeconds / 3600) > 1 ? "s" : ""} ago`;
  return `${Math.floor(elapsedSeconds / 86400)} day${Math.floor(elapsedSeconds / 86400) > 1 ? "s" : ""} ago`;
};

const getNotificationMeta = (item) => {
  const content = `${item.type || ""} ${item.title || ""} ${item.message || ""}`.toLowerCase();
  if (content.includes("user") || content.includes("registered") || content.includes("approval")) {
    return { icon: <FiUserPlus />, category: "User Management", bg: "#eff6ff", color: "#2563eb" };
  }
  if (content.includes("complaint")) {
    return { icon: <FiClipboard />, category: "Complaint", bg: "#f5f3ff", color: "#7c3aed" };
  }
  if (content.includes("provider") || content.includes("assigned") || content.includes("maintenance")) {
    return { icon: <FiTool />, category: "Maintenance", bg: "#f0fdf4", color: "#16a34a" };
  }
  if (content.includes("estimate")) {
    return { icon: <FiClipboard />, category: "Estimate", bg: "#eff6ff", color: "#0284c7" };
  }
  if (content.includes("bill") || content.includes("payment")) {
    return { icon: <FiDollarSign />, category: "Payment", bg: "#fefce8", color: "#ca8a04" };
  }
  if (content.includes("overdue") || content.includes("alert")) {
    return { icon: <FiAlertTriangle />, category: "Alert", bg: "#fff1f2", color: "#e11d48" };
  }
  return { icon: <FiBell />, category: item.category || "General", bg: "#eff6ff", color: "#2563eb" };
};

const NotificationCard = ({ item, onMarkRead, onDelete }) => {
  const isUnread = item.status === "unread";
  const meta = getNotificationMeta(item);

  return (
    <div className={`notification-card ${isUnread ? "unread" : ""}`}>
      <div className="icon-badge" style={{ backgroundColor: meta.bg, color: meta.color }}>
        {meta.icon}
      </div>
      <div className="details-column">
        <div className="card-top-row">
          <div className="title-group">
            <h3>{item.title || "Notification"}</h3>
            {isUnread && <span className="new-tag">New</span>}
          </div>
          <div className="timestamp-text">
            <FiClock size={14} />
            <span>{formatTimeAgo(item.time || item.createdAt)}</span>
          </div>
        </div>
        <span className="category-pill">{meta.category}</span>
        <p className="message-body">{item.message}</p>
        <div className="action-links">
          {isUnread && (
            <button type="button" className="action-button read" onClick={() => onMarkRead(item.id)}>
              <FiCheckCircle size={16} /> Mark as Read
            </button>
          )}
          <button type="button" className="action-button delete" onClick={() => onDelete(item.id)}>
            <FiTrash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagerComposer = ({ serviceProviders, onSend }) => {
  const [selectedType, setSelectedType] = useState("Maintenance");
  const [recipient, setRecipient] = useState("service_provider");
  const [providerId, setProviderId] = useState("all");
  const [title, setTitle] = useState("");
  const [complaintRef, setComplaintRef] = useState("");
  const [message, setMessage] = useState("");
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = () => {
    setSelectedType("Maintenance");
    setRecipient("service_provider");
    setProviderId("all");
    setTitle("");
    setComplaintRef("");
    setMessage("");
    setBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setBanner({ type: "error", message: "Please fill in title and message." });
      return;
    }
    setSubmitting(true);
    const chosenType = COMPOSER_TYPES.find((t) => t.id === selectedType);
    const success = await onSend({
      title: title.trim(),
      message: message.trim(),
      complaintRef: complaintRef.trim(),
      type: chosenType?.apiType || "custom",
      categoryName: selectedType,
      recipient,
      providerId,
    });
    setSubmitting(false);

    if (success) {
      setBanner({ type: "success", message: "Notification sent successfully!" });
      setTitle("");
      setComplaintRef("");
      setMessage("");
    } else {
      setBanner({ type: "error", message: "Failed to send notification." });
    }
  };

  return (
    <div className="card-box composer-card">
      <div className="composer-header">
        <FiBell color="#f59e0b" size={24} />
        <div>
          <h2>Create & Send Notification</h2>
          <p>Send a targeted notification to residents, service providers, or the property owner</p>
        </div>
      </div>

      {banner && (
        <div className={`status-alert ${banner.type}`}>
          {banner.type === "success" ? <FiCheckCircle /> : <FiAlertTriangle />}
          <span>{banner.message}</span>
        </div>
      )}

      <div>
        <span className="section-caption">Notification Type</span>
        <div className="type-grid" style={{ marginTop: "8px" }}>
          {COMPOSER_TYPES.map((t) => (
            <div
              key={t.id}
              className={`type-card ${selectedType === t.id ? "selected" : ""}`}
              onClick={() => setSelectedType(t.id)}
            >
              <div style={{ fontSize: "1.3rem" }}>{t.icon}</div>
              <strong>{t.title}</strong>
              <span>{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="section-caption">Send To</span>
        <div className="audience-group" style={{ marginTop: "8px" }}>
          {AUDIENCE_OPTIONS.map((a) => (
            <div
              key={a.id}
              className={`audience-pill ${recipient === a.id ? "selected" : ""}`}
              onClick={() => setRecipient(a.id)}
            >
              {a.icon}
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {recipient === "service_provider" && (
        <div className="field-box">
          <label>Select Service Provider</label>
          <select className="form-input" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            <option value="all">— All Service Providers —</option>
            {serviceProviders.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name} {sp.category ? `(${sp.category})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <form className="form-layout" onSubmit={handleSubmit}>
        <div className="input-columns">
          <div className="field-box">
            <label>Notification Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. AC Repair Scheduled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field-box">
            <label>Complaint Reference (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. C-2410"
              value={complaintRef}
              onChange={(e) => setComplaintRef(e.target.value)}
            />
          </div>
        </div>

        <div className="field-box">
          <label>Message *</label>
          <textarea
            className="form-textarea"
            rows="3"
            placeholder="Enter the notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="button-row" style={{ gap: "12px" }}>
          <button type="submit" className="primary-button" disabled={submitting}>
            <FiSend /> {submitting ? "Sending..." : "Send Notification"}
          </button>
          <button type="button" className="secondary-button" onClick={handleReset} disabled={submitting}>
            <FiRotateCcw /> Reset
          </button>
        </div>
      </form>
    </div>
  );
};

function Notifications({ role = "admin", userId, name }) {
  const { currentUser } = useAuth();
  const currentRole = ROLE_PROFILES[role] ? role : "admin";
  const profile = ROLE_PROFILES[currentRole];
  const activeUserId = userId || currentUser?.id || profile.userId;
  const displayName = name || currentUser?.name || profile.name;

  const dispatch = useDispatch();
  const viewer = useMemo(() => ({ role: currentRole, id: activeUserId }), [currentRole, activeUserId]);
  // all notification data comes from the Redux store
  const reduxNotifications = useSelector((state) => state.notifications);
  // service providers (for the manager's composer) come from the users slice
  const usersSession = useMemo(() => ({ role: "maintenance_manager", id: activeUserId }), [activeUserId]);
  const users = useSelector((state) => selectUsers(state, usersSession));
  const serviceProviders = useMemo(() => users.filter((u) => u.role === "service_provider"), [users]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  // Deduplicate so rejections are not shown twice
  const displayedList = useMemo(() => {
    const source = (reduxNotifications || []).map((item) => ({ ...item, time: item.time || formatTimeAgo(item.createdAt) }));

    if (currentRole === "service_provider") {
      return selectServiceProviderNotifications(source, activeUserId);
    }

    const seen = new Set();
    const result = [];
    for (const n of source) {
      const isForUser = !n.userId || String(n.userId) === String(activeUserId) || n.recipient === currentRole || n.recipient === "all";
      if (!isForUser) continue;

      const cId = extractComplaintId(n);
      const isRej = isComplaintRejected(n);
      const isEstRej = isEstimateRejected(n);

      const rejectKey = isRej && cId ? `reject-${cId}` : null;
      const estRejectKey = isEstRej && cId ? `est-reject-${cId}` : null;
      const key = `${cId || n.id}-${n.type || ""}-${(n.message || "").trim().toLowerCase()}`;
      if (seen.has(key) || (rejectKey && seen.has(rejectKey)) || (estRejectKey && seen.has(estRejectKey))) continue;
      seen.add(key);
      if (rejectKey) seen.add(rejectKey);
      if (estRejectKey) seen.add(estRejectKey);
      result.push(n);
    }
    return result;
  }, [reduxNotifications, activeUserId, currentRole]);

  // READ: backend -> Redux
  useEffect(() => {
    setIsLoading(true);
    const request = dispatch(fetchNotifications({ viewer }));
    request.finally(() => setIsLoading(false));
    return () => request.abort();
  }, [dispatch, viewer]);

  useEffect(() => {
    if (currentRole !== "maintenance_manager") return undefined;
    const request = dispatch(fetchUsers({ session: usersSession }));
    return () => request.abort();
  }, [dispatch, currentRole, usersSession]);

  // UPDATE / DELETE: Redux changes only after the backend succeeds
  const run = async (thunkAction) => {
    setActionError("");
    try {
      await dispatch(thunkAction).unwrap();
      return true;
    } catch (err) {
      setActionError(err.message || "The change could not be saved.");
      return false;
    }
  };

  const handleMarkRead = (id) => run(markNotificationAsRead({ id: Number(id), viewer }));
  const handleDelete = (id) => run(deleteNotification({ id: Number(id), viewer }));
  const handleMarkAllRead = () => run(markAllNotificationsAsRead({ viewer }));
  const handleClearAll = () => run(clearAllNotifications({ viewer }));

  // CREATE: backend first, then the saved notification is added to Redux
  const handleSendNotification = async ({ title: t, message: m, complaintRef: ref, type: tp, recipient: rec, providerId: pId }) => {
    const targetUserId = rec === "service_provider" ? (pId === "all" ? 10 : Number(pId)) : rec === "admin" ? 13 : rec === "maintenance_manager" ? 5 : 1;
    const match = ref?.match(/\d+/);
    const payload = {
      userId: targetUserId,
      type: tp,
      recipient: rec,
      message: `${t}: ${m}${ref ? ` (Ref: ${ref})` : ""}`,
      ...(match ? { complaintId: Number(match[0]) } : {}),
    };
    return run(createNotification({ data: payload, sender: viewer }));
  };

  const unreadCount = useMemo(() => displayedList.filter((n) => n.status === "unread").length, [displayedList]);

  const filteredNotifications = useMemo(() => {
    return displayedList.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return item.status === "unread";
      if (activeFilter === "read") return item.status === "read";
      return getNotificationMeta(item).category.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [displayedList, activeFilter]);

  return (
    <div>
      <Navbar name={displayName} role={currentRole} />

      <div className="notifications-page">
        <div className="notifications-content">
          {actionError && (
            <div className="card-box" role="alert" style={{ color: "#DC2626" }}>{actionError}</div>
          )}
          {currentRole === "maintenance_manager" && (
            <ManagerComposer serviceProviders={serviceProviders} onSend={handleSendNotification} />
          )}

          <div className="card-box">
            <div className="header-row">
              <div>
                <h1>{profile.title}</h1>
                <p>{profile.subtitle}</p>
              </div>
              <div className="unread-pill">{unreadCount} Unread</div>
            </div>

            <div className="toolbar-row">
              <select className="filter-dropdown" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
                <option value="User Management">User Management</option>
                <option value="Complaint">Complaints</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Payment">Payments</option>
              </select>

              <div className="button-group">
                <button type="button" className="primary-button" onClick={handleMarkAllRead}>
                  <FiCheck size={18} /> Mark All Read
                </button>
                <button type="button" className="secondary-button" onClick={handleClearAll}>
                  <FiTrash2 size={16} /> Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="empty-card">
                <FiClock size={36} color="#9ca3af" />
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-card">
                <FiBell size={36} color="#9ca3af" />
                <h3 style={{ margin: "0" }}>No Notifications Found</h3>
                <p style={{ margin: "0" }}>
                  {activeFilter !== "all"
                    ? `No notifications found matching filter "${activeFilter}".`
                    : "You're all caught up! No active notifications at this time."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <NotificationCard key={n.id} item={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
