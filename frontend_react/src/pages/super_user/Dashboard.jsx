import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiBriefcase, FiCheckCircle, FiClock, FiHome, FiRefreshCw, FiTool, FiUsers, FiXCircle } from "react-icons/fi";
import { formatRole, getRoleSession, roleRequest } from "../../services/roleApi";
import "./SuperUserPages.css";

const ROLE_METRICS = [
  { key: "owner", title: "Property Owners", icon: FiHome, tone: "blue", hintLabel: "Societies" },
  { key: "maintenance_manager", title: "Maintenance Managers", icon: FiTool, tone: "green", hintLabel: "Blocks" },
  { key: "service_provider", title: "Service Providers", icon: FiBriefcase, tone: "orange", hintLabel: "Trades" },
];
const CLOSED_STATUSES = new Set(["completed", "closed", "resolved", "rejected"]);

function displayTime(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export default function SuperUserDashboard() {
  const session = getRoleSession("super_user");
  const [data, setData] = useState({ users: [], complaints: [], pending: [] });
  const [state, setState] = useState({ loading: true, error: "" });
  const [health, setHealth] = useState({ loading: true, error: "", server: "Checking…", database: "Checking…", latency: "—", modules: "—", checked: "—" });

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const [users, complaints, pending] = await Promise.all([
        roleRequest("super_user", session.id, "/users"),
        roleRequest("super_user", session.id, "/complaints"),
        roleRequest("super_user", session.id, "/users/pending"),
      ]);
      setData({ users: Array.isArray(users) ? users : [], complaints: Array.isArray(complaints) ? complaints : [], pending: Array.isArray(pending) ? pending : [] });
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }, [session.id]);

  const ping = useCallback(async () => {
    const started = performance.now();
    setHealth((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const result = await roleRequest("super_user", session.id, "/");
      setHealth({ loading: false, error: "", server: result?.status === "running" ? "Operational" : "Available", database: result?.database === "connected" ? "Healthy" : "Connected", latency: `${Math.round(performance.now() - started)}ms`, modules: `${Array.isArray(result?.modules) ? result.modules.length : 0} Active`, checked: `Live (${new Date().toLocaleTimeString()})` });
    } catch (error) {
      setHealth({ loading: false, error: error.message, server: "Offline / Error", database: "Unreachable", latency: `${Math.round(performance.now() - started)}ms`, modules: "Unavailable", checked: `Checked (${new Date().toLocaleTimeString()})` });
    }
  }, [session.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    ping();
    const timer = window.setInterval(ping, 15000);
    return () => window.clearInterval(timer);
  }, [ping]);

  const activeComplaints = data.complaints.filter((complaint) => !CLOSED_STATUSES.has(String(complaint.status || "").toLowerCase()));
  const metricCards = [
    { title: "Total System Participants", value: data.users.length, hint: "All Roles", icon: FiUsers, tone: "purple" },
    ...ROLE_METRICS.map((metric) => {
      const group = data.users.filter((user) => user.role === metric.key);
      let hintCount = 0;
      if (metric.key === "owner") {
        hintCount = new Set(data.users.map((user) => user.communityName).filter(Boolean)).size;
      } else if (metric.key === "maintenance_manager") {
        hintCount = new Set(group.map((user) => `${user.communityName || ""}:${user.block || ""}`).filter((block) => block !== ":")).size;
      } else {
        hintCount = new Set(group.map((user) => user.category).filter(Boolean)).size;
      }
      return { ...metric, value: group.length, hint: `${hintCount} ${metric.hintLabel}` };
    }),
    { title: "Active Complaints", value: activeComplaints.length, hint: "In Progress", icon: FiAlertTriangle, tone: "red" },
  ];
  const recentUsers = [...data.users].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 4);
  const healthRows = [
    ["Server Status", health.server, health.server === "Operational" || health.server === "Available"],
    ["Database Connection", health.database, health.database === "Healthy" || health.database === "Connected"],
    ["API Response Time", health.latency, true],
    ["Active Modules", health.modules, true],
    ["Last Checked", health.checked, true],
  ];

  return <main className="role-page superuser-role-page superuser-dashboard">
    <header className="role-head"><div><h1>Welcome Back, {session.name}!</h1><p>Super User · {session.email || ""} · System-wide real-time operations and activity</p></div><button className="role-button secondary" onClick={load} disabled={state.loading}><FiRefreshCw /> Refresh</button></header>
    {state.error && <div className="role-alert" role="alert">Could not load platform data: {state.error}</div>}
    {state.loading ? <div className="role-empty">Loading platform data…</div> : <>
      <section className="su-stats-grid" aria-label="System overview">
        {metricCards.map(({ title, value, hint, icon: Icon, tone }) => <article className={`su-stat-card ${tone}`} key={title}>
          <div className="su-stat-icon"><Icon aria-hidden="true" /><span>{hint}</span></div>
          <div className="su-stat-body"><strong>{value}</strong><span>{title}</span></div>
        </article>)}
      </section>
      <div className="su-dashboard-bottom">
        <section className="role-panel su-dashboard-panel"><div className="su-panel-heading"><h2>Recent System Activity</h2><span className="su-live-pill">Live Log</span></div>
          {recentUsers.length ? recentUsers.map((user) => <div className="su-activity-item" key={user.id}>
            <span className={`su-activity-icon ${user.role === "admin" ? "purple" : user.role === "maintenance_manager" ? "green" : user.role === "service_provider" ? "orange" : "blue"}`}><FiUsers /></span>
            <div className="su-activity-person"><strong>{user.name}</strong><span>{formatRole(user.role)}</span></div><time>{displayTime(user.createdAt)}</time>
          </div>) : <div className="role-empty">No participant activity is available.</div>}
        </section>
        <section className="role-panel su-dashboard-panel"><div className="su-panel-heading"><h2>System Health &amp; Diagnostics</h2><button className="role-button secondary su-ping" onClick={ping} disabled={health.loading}><FiRefreshCw /> Ping</button></div>
          {health.error && <p className="su-health-error" role="status">Health check failed: {health.error}</p>}
          <div className="su-health-list">{healthRows.map(([label, value, healthy]) => <div className="su-health-row" key={label}><span>{label}</span><strong className={healthy ? "good" : "info"}>{value}</strong></div>)}</div>
        </section>
      </div>
    </>}
  </main>;
}
