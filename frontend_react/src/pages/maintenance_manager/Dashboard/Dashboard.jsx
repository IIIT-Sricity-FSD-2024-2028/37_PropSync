import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ManagerLayout, { getManagerName } from "../shared/ManagerLayout";
import KpiCard from "../shared/KpiCard";
import WelcomeBanner from "./components/WelcomeBanner";
import SystemAlerts from "./components/SystemAlerts";
import PendingComplaintsTable from "./components/PendingComplaintsTable";
import RecentNotifications from "./components/RecentNotifications";
import StatusOverview from "./components/StatusOverview";
import MaintenanceShortcutCard from "./components/MaintenanceShortcutCard";
import TopProviderCard from "./components/TopProviderCard";
import useComplaintActions from "../shared/useComplaintActions";
import { MM_PATHS } from "../shared/paths";
import {
  fetchComplaints, fetchEstimates, fetchProviders, getCurrentManager, getManagerId, mapComplaint, today,
} from "../../../services/managerService";
import { fetchNotifications } from "../../../services/notificationService"; // COMMON service

const DONE = ["Completed", "Paid", "Closed"];

/* dashboard.html */
export default function Dashboard() {
  const user = getCurrentManager();
  const [complaints, setComplaints] = useState([]);
  const [pendingEstimates, setPendingEstimates] = useState(0);
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = useCallback(async () => {
    try {
      setComplaints((await fetchComplaints()).map(mapComplaint));
    } catch (e) {
      console.error("Error fetching complaints", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
    fetchEstimates().then((all) => setPendingEstimates(all.filter((e) => e.approved === null).length)).catch(() => {});
    fetchProviders().then(setProviders).catch(() => {});
    fetchNotifications("maintenance_manager", getManagerId())
      .then((list) => setNotifications(Array.isArray(list) ? list.slice(0, 5) : []))
      .catch(() => setNotifications([]));
    const t = setInterval(loadComplaints, 15000); // same 15s refresh as the HTML version
    return () => clearInterval(t);
  }, [loadComplaints]);

  const { askApprove, askReject, modals } = useComplaintActions(loadComplaints);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    completed: complaints.filter((c) => DONE.includes(c.status)).length,
    overdue: complaints.filter((c) => c.deadline && c.deadline < today() && !DONE.includes(c.status) && c.status !== "Rejected").length,
  }), [complaints]);

  const topProvider = useMemo(() => {
    const counts = {};
    complaints.filter((c) => DONE.includes(c.status) && c.assignedProviderId)
      .forEach((c) => (counts[c.assignedProviderId] = (counts[c.assignedProviderId] || 0) + 1));
    const [bestId, jobs] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    const p = providers.find((x) => String(x.id) === String(bestId)) || providers[0];
    return p ? { ...p, jobs: jobs || 0 } : null;
  }, [complaints, providers]);

  const alerts = [
    pendingEstimates > 0 && {
      id: "est",
      content: (
        <>
          {pendingEstimates} service estimate{pendingEstimates > 1 ? "s" : ""} awaiting approval –{" "}
          <Link to={MM_PATHS.serviceEstimate} style={{ color: "#D97706", fontWeight: 600 }}>Review Now</Link>
        </>
      ),
    },
    stats.overdue > 0 && { id: "overdue", content: `${stats.overdue} maintenance request${stats.overdue > 1 ? "s" : ""} overdue` },
    stats.pending > 0 && { id: "pending", content: `${stats.pending} new complaint${stats.pending > 1 ? "s" : ""} waiting for your approval` },
  ].filter(Boolean);

  return (
    <ManagerLayout>
      <WelcomeBanner name={getManagerName()} block={user.block} community={user.communityName || "Green Valley Society"} />

      <div className="kpi-grid">
        <KpiCard label="Total Complaints" value={stats.total} icon="clipboard" tone="blue" />
        <KpiCard label="Pending Approvals" value={stats.pending} icon="clock" tone="yellow" />
        <KpiCard label="In Progress" value={stats.inProgress} icon="trending" tone="black" />
        <KpiCard label="Completed" value={stats.completed} icon="checkCircle" tone="green" />
      </div>

      <SystemAlerts alerts={alerts} />

      <div className="two-col-grid">
        <PendingComplaintsTable
          complaints={complaints.filter((c) => c.status === "Pending")}
          loading={loading}
          onApprove={askApprove}
          onReject={askReject}
        />
        <RecentNotifications notifications={notifications} />
      </div>

      <div className="grid-3">
        <StatusOverview
          total={stats.total}
          bars={[
            { label: "Pending", val: stats.pending, color: "#D97706" },
            { label: "In Progress", val: stats.inProgress, color: "#DC2626" },
            { label: "Completed", val: stats.completed, color: "#16A34A" },
          ]}
        />
        <MaintenanceShortcutCard />
        <TopProviderCard provider={topProvider} />
      </div>

      {modals}
    </ManagerLayout>
  );
}
