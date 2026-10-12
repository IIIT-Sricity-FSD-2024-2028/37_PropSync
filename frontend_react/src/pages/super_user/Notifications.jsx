import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle, FiClock, FiRefreshCw, FiShield, FiUserPlus, FiAlertTriangle } from "react-icons/fi";
import { getRoleSession, roleRequest } from "../../services/roleApi";
import "./SuperUserPages.css";

const TYPE_LABELS = { complaint_submitted: "Complaints", complaint_approved: "Complaints", complaint_rejected: "Complaints", provider_assigned: "Service Assignment", estimate_submitted: "Estimates", estimate_approved: "Estimates", work_completed: "Maintenance", payment_due: "Payments", overdue: "Deadlines", custom: "System" };
function relativeTime(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / 3600000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function iconFor(type) {
  if (type?.includes("complaint") || type === "overdue") return FiAlertTriangle;
  if (type === "custom") return FiUserPlus;
  if (type === "work_completed" || type?.includes("approved")) return FiShield;
  return FiBell;
}

export default function SuperUserNotifications() {
  const session = getRoleSession("super_user");
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState([]);
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState({ loading: true, busy: "", error: "", success: "" });
  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const [notifications, requests] = await Promise.all([roleRequest("super_user", session.id, "/notifications"), roleRequest("super_user", session.id, "/users/pending")]);
      setItems(Array.isArray(notifications) ? notifications : []);
      setPending(Array.isArray(requests) ? requests : []);
      setState((previous) => ({ ...previous, loading: false }));
    } catch (error) { setState((previous) => ({ ...previous, loading: false, error: error.message })); }
  }, [session.id]);
  useEffect(() => { load(); }, [load]);
  const displayed = useMemo(() => items.filter((item) => filter === "all" || item.status === filter), [items, filter]);
  const decide = async (user, decision) => {
    setState((previous) => ({ ...previous, busy: `${decision}-${user.id}`, error: "", success: "" }));
    try {
      await roleRequest("super_user", session.id, `/users/${user.id}/${decision}`, { method: "PATCH" });
      setPending((list) => list.filter((entry) => entry.id !== user.id));
      setItems((list) => list.map((entry) => entry.relatedUserId === user.id ? { ...entry, status: "read" } : entry));
      setState((previous) => ({ ...previous, busy: "", success: `${user.name} ${decision === "approve" ? "approved" : "rejected"} successfully.` }));
    } catch (error) { setState((previous) => ({ ...previous, busy: "", error: error.message })); }
  };
  const markRead = async (item) => {
    try {
      await roleRequest("super_user", session.id, `/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((list) => list.map((entry) => entry.id === item.id ? { ...entry, status: "read" } : entry));
    } catch (error) { setState((previous) => ({ ...previous, error: error.message })); }
  };
  const markAll = async () => {
    setState((previous) => ({ ...previous, busy: "mark-all", error: "" }));
    try {
      await Promise.all(items.filter((item) => item.status === "unread").map((item) => roleRequest("super_user", session.id, `/notifications/${item.id}/read`, { method: "PATCH" })));
      setItems((list) => list.map((item) => ({ ...item, status: "read" })));
      setState((previous) => ({ ...previous, busy: "", success: "All notifications marked as read." }));
    } catch (error) { setState((previous) => ({ ...previous, busy: "", error: error.message })); }
  };
  const unread = items.filter((item) => item.status === "unread").length;

  return <main className="role-page superuser-role-page superuser-notifications">
    <section className="su-notification-header"><div className="su-notification-top"><div><h1>Notifications</h1><p>View alerts and updates related to system activities and administrator registrations.</p></div>{unread > 0 && <span className="su-unread-pill">{unread} Unread</span>}</div>
      <div className="su-notification-controls"><select className="role-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter notifications"><option value="all">All Notifications</option><option value="unread">Unread Only</option><option value="read">Read Only</option></select><div className="role-actions"><button className="role-button" onClick={markAll} disabled={!unread || state.busy === "mark-all"}><FiCheck /> Mark All Read</button><button className="role-button secondary" onClick={load} disabled={state.loading}><FiRefreshCw /> Refresh</button></div></div>
    </section>
    {state.error && <div className="role-alert" role="alert">{state.error}</div>}{state.success && <div className="role-alert success" role="status">{state.success}</div>}
    {pending.length > 0 && <section className="role-panel su-signup-panel"><div className="su-panel-heading"><div><h2>Administrator Signup Requests</h2><p>{pending.length} pending request{pending.length === 1 ? "" : "s"}</p></div></div><div className="role-table-wrap"><table className="role-table"><thead><tr><th>Applicant</th><th>Community</th><th>Phone</th><th>Requested</th><th>Actions</th></tr></thead><tbody>{pending.map((user) => <tr key={user.id}><td>{user.name}<div className="role-muted">{user.email}</div></td><td>{user.communityName || "—"}</td><td>{user.phone || "—"}</td><td>{user.createdAt || "—"}</td><td><div className="role-actions"><button className="role-button" disabled={Boolean(state.busy)} onClick={() => decide(user, "approve")}>{state.busy === `approve-${user.id}` ? "Approving…" : "Approve"}</button><button className="role-button danger" disabled={Boolean(state.busy)} onClick={() => decide(user, "reject")}>{state.busy === `reject-${user.id}` ? "Rejecting…" : "Reject"}</button></div></td></tr>)}</tbody></table></div></section>}
    <section className="su-notification-list" aria-label="Notifications">{state.loading ? <div className="role-empty">Loading notifications…</div> : !displayed.length ? <div className="role-panel role-empty">{filter === "unread" ? "You have no unread notifications." : filter === "read" ? "You have no read notifications." : "You’re all caught up!"}</div> : displayed.map((item) => {
      const Icon = iconFor(item.type);
      const color = item.type === "overdue" || item.type === "complaint_rejected" ? "warning" : item.type === "complaint_approved" || item.type === "work_completed" ? "success" : "info";
      return <article className={`su-notification-card ${color} ${item.status}`} key={item.id}>
        <span className={`su-notification-icon ${color}`}><Icon /></span><div className="su-notification-content"><div className="su-notification-title-row"><div><h2>{item.title || "System notification"}{item.status === "unread" && <span className="su-new-pill">New</span>}</h2><span className="su-notification-category">{TYPE_LABELS[item.type] || "System"}</span></div><time><FiClock /> {relativeTime(item.createdAt)}</time></div><p>{item.message}</p><div className="su-notification-actions">{item.status === "unread" && <button onClick={() => markRead(item)}><FiCheckCircle /> Mark as Read</button>}</div></div>
      </article>;
    })}</section>
  </main>;
}