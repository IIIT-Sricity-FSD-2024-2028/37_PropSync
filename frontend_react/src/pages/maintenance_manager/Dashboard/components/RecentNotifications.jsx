import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

/* "Notifications" panel – latest 5, click goes to the Notifications page */
export default function RecentNotifications({ notifications }) {
  const navigate = useNavigate();
  const unread = notifications.filter((n) => n.status === "unread").length;
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          Notifications <span className="count-pill">{unread}</span>
        </h2>
        <Link to={MM_PATHS.notifications} className="btn-link">
          View All <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      <div style={{ paddingTop: 16 }}>
        {notifications.length === 0 && <p className="muted">No notifications</p>}
        {notifications.map((n) => (
          <div key={n.id} className={`notif-item${n.status === "unread" ? " unread" : ""}`} onClick={() => navigate(MM_PATHS.notifications)}>
            <div className="notif-icon-wrap tone-green">
              <Icon name={n.type === "estimate_submitted" ? "file" : "bell"} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="notif-title">
                {n.title || "Notification"}
                {n.status === "unread" && <span className="new-dot">New</span>}
              </p>
              <p className="notif-msg">{n.message}</p>
              <p className="notif-time">{n.time || timeAgo(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
