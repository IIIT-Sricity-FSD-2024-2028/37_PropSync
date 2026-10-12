import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiBriefcase, FiHome, FiRefreshCw, FiTool, FiUsers } from "react-icons/fi";
import { formatRole, getRoleSession, roleRequest } from "../../services/roleApi";
import "./AdminPages.css";

const CLOSED_STATUSES = new Set(["closed", "completed", "rejected", "resolved"]);

export default function AdministratorDashboard() {
  const session = getRoleSession("admin");
  const [data, setData] = useState({ users: [], complaints: [], pending: [] });
  const [state, setState] = useState({ loading: true, error: "" });
  const [health, setHealth] = useState({ loading: true, error: "", server: "Checking...", database: "Checking...", latency: "—", modules: "—", checked: "—" });

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const [users, complaints, pending] = await Promise.all([
        roleRequest("admin", session.id, "/users"),
        roleRequest("admin", session.id, "/complaints"),
        roleRequest("admin", session.id, "/users/pending"),
      ]);
      setData({
        users: Array.isArray(users) ? users.filter((user) => user.approvalStatus === "approved") : [],
        complaints: Array.isArray(complaints) ? complaints : [],
        pending: Array.isArray(pending) ? pending : [],
      });
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }, [session.id]);

  const ping = useCallback(async () => {
    const started = performance.now();
    setHealth((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const result = await roleRequest("admin", session.id, "/");
      setHealth({
        loading: false,
        error: "",
        server: result?.status === "running" ? "Operational" : "Available",
        database: result?.database === "connected" ? "Healthy" : "Connected",
        latency: `${Math.round(performance.now() - started)}ms`,
        modules: `${Array.isArray(result?.modules) ? result.modules.length : 0} Active`,
        checked: `Live (${new Date().toLocaleTimeString()})`,
      });
    } catch (error) {
      setHealth({ loading: false, error: error.message, server: "Offline", database: "Unreachable", latency: `${Math.round(performance.now() - started)}ms`, modules: "Unavailable", checked: `Checked (${new Date().toLocaleTimeString()})` });
    }
  }, [session.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    ping();
    const timer = window.setInterval(ping, 15000);
    return () => window.clearInterval(timer);
  }, [ping]);

  const activeComplaints = data.complaints.filter((complaint) => !CLOSED_STATUSES.has(String(complaint.status || "").toLowerCase()));
  const metrics = [
    { label: "Community Participants", value: data.users.length, note: "All approved roles", icon: FiUsers, tone: "purple" },
    { label: "Property Owners", value: data.users.filter((user) => user.role === "owner").length, note: "Active accounts", icon: FiHome, tone: "blue" },
    { label: "Maintenance Managers", value: data.users.filter((user) => user.role === "maintenance_manager").length, note: "Active accounts", icon: FiTool, tone: "green" },
    { label: "Service Providers", value: data.users.filter((user) => user.role === "service_provider").length, note: "Active accounts", icon: FiBriefcase, tone: "orange" },
    { label: "Active Complaints", value: activeComplaints.length, note: "In progress", icon: FiAlertTriangle, tone: "red" },
  ];
  const recentUsers = [...data.users].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 4);
  const healthRows = [["Server Status", health.server], ["Database Connection", health.database], ["API Response Time", health.latency], ["Active Modules", health.modules], ["Last Checked", health.checked]];

  return <main className="role-page admin-role-page admin-dashboard">
    <header className="admin-dashboard-heading"><div><h1>Welcome Back, {session.name}!</h1><p>Administrator · {session.email || ""} · Community-specific statistics and activity</p></div><button className="role-button secondary" onClick={load} disabled={state.loading}><FiRefreshCw /> Refresh</button></header>
    {state.error && <div className="role-alert" role="alert">Could not load community data: {state.error}</div>}
    {state.loading ? <div className="role-empty">Loading community dashboard...</div> : <>
      <section className="admin-stats-grid" aria-label="Community statistics">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => <article className={`admin-stat-card ${tone}`} key={label}>
          <div className="admin-stat-icon"><Icon aria-hidden="true" /><span>{note}</span></div>
          <div className="admin-stat-body"><strong>{value}</strong><span>{label}</span></div>
        </article>)}
      </section>
      <div className="admin-dashboard-bottom">
        <section className="role-panel admin-dashboard-panel"><div className="admin-panel-heading"><h2>Community Participants</h2><span>Recent registrations</span></div>
          {recentUsers.length ? recentUsers.map((user) => <div className="admin-registration" key={user.id}>
            <span className={`admin-registration-icon ${user.role === "maintenance_manager" ? "green" : user.role === "service_provider" ? "orange" : "blue"}`}><FiUsers /></span>
            <div className="admin-registration-person"><strong>{user.name}</strong><span>{formatRole(user.role)}</span></div><time>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</time>
          </div>) : <div className="role-empty">No participants found for this community.</div>}
        </section>
        <section className="role-panel admin-dashboard-panel"><div className="admin-panel-heading"><h2>System Health</h2><button className="role-button secondary admin-ping" onClick={ping} disabled={health.loading}><FiRefreshCw /> Ping</button></div>
          {health.error && <p className="admin-health-error" role="status">Health check failed: {health.error}</p>}
          {healthRows.map(([label, value], index) => <div className="admin-health-row" key={label}><span>{label}</span><strong className={index < 2 && /offline|unreachable/i.test(value) ? "bad" : index < 2 ? "good" : "info"}>{value}</strong></div>)}
        </section>
      </div>
    </>}
  </main>;
}