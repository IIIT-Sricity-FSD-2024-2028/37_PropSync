import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { fetchNotifications } from "../../../redux/features/notifications/notificationsSlice";
import {
  fetchEstimates,
  selectEstimates,
} from "../../../redux/features/estimates/estimatesSlice";
import { MM_PATHS } from "../shared/paths";
import {
  getCurrentManager,
  getManagerId,
  today,
} from "../../../services/managerService";
import {
  getManagerViewer,
  useManagerComplaints,
  useServiceProviders,
} from "../shared/useManagerData";

const DONE = ["Completed", "Paid", "Closed"];

/* dashboard.html */
export default function Dashboard() {
  const dispatch = useDispatch();
  const user = getCurrentManager();
  // all data comes from the Redux store; loading goes through thunks
  const reduxNotifications = useSelector((state) => state.notifications);
  const { rows: complaints, loading, reload } = useManagerComplaints();
  const { providers } = useServiceProviders();
  const estimates = useSelector(selectEstimates);

  const loadComplaints = useCallback(() => {
    reload();
    dispatch(fetchEstimates({ viewer: getManagerViewer() }));
  }, [reload, dispatch]);

  useEffect(() => {
    const estimatesReq = dispatch(
      fetchEstimates({ viewer: getManagerViewer() }),
    );
    const notificationsReq = dispatch(
      fetchNotifications({ viewer: getManagerViewer() }),
    );
    const t = setInterval(loadComplaints, 15000); // same 15s refresh as the HTML version
    return () => {
      estimatesReq.abort();
      notificationsReq.abort();
      clearInterval(t);
    };
  }, [loadComplaints, dispatch]);

  const activeManagerNotifs = useMemo(() => {
    const managerId = String(getManagerId());
    return (reduxNotifications || [])
      .filter(
        (n) =>
          n.recipient === "maintenance_manager" ||
          !n.recipient ||
          String(n.userId) === managerId,
      )
      .slice(0, 5);
  }, [reduxNotifications]);

  const { askApprove, askReject, modals } = useComplaintActions(loadComplaints);
  const pendingEstimates = useMemo(
    () =>
      estimates.filter(
        (e) =>
          e.approved === null &&
          e.selectionStatus !== "not_selected" &&
          complaints.some((c) => String(c.id) === String(e.complaintId)),
      ).length,
    [complaints, estimates],
  );

  const stats = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "Pending").length,
      inProgress: complaints.filter((c) => c.status === "In Progress").length,
      completed: complaints.filter((c) => DONE.includes(c.status)).length,
      overdue: complaints.filter(
        (c) =>
          c.deadline &&
          c.deadline < today() &&
          !DONE.includes(c.status) &&
          c.status !== "Rejected",
      ).length,
    }),
    [complaints],
  );

  const topProvider = useMemo(() => {
    const counts = {};
    complaints
      .filter((c) => DONE.includes(c.status) && c.assignedProviderId)
      .forEach(
        (c) =>
          (counts[c.assignedProviderId] =
            (counts[c.assignedProviderId] || 0) + 1),
      );
    const [bestId, jobs] =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    const p =
      providers.find((x) => String(x.id) === String(bestId)) || providers[0];
    return p ? { ...p, jobs: jobs || 0 } : null;
  }, [complaints, providers]);

  const alerts = [
    pendingEstimates > 0 && {
      id: "est",
      content: (
        <>
          {pendingEstimates} service estimate{pendingEstimates > 1 ? "s" : ""}{" "}
          awaiting approval –{" "}
          <Link
            to={MM_PATHS.serviceEstimate}
            style={{ color: "#D97706", fontWeight: 600 }}
          >
            Review Now
          </Link>
        </>
      ),
    },
    stats.overdue > 0 && {
      id: "overdue",
      content: `${stats.overdue} maintenance request${stats.overdue > 1 ? "s" : ""} overdue`,
    },
    stats.pending > 0 && {
      id: "pending",
      content: `${stats.pending} new complaint${stats.pending > 1 ? "s" : ""} waiting for your approval`,
    },
  ].filter(Boolean);

  return (
    <ManagerLayout>
      <WelcomeBanner
        name={getManagerName()}
        block={user.block}
        community={user.communityName || "Green Valley Society"}
      />

      <div className="kpi-grid">
        <KpiCard
          label="Total Complaints"
          value={stats.total}
          icon="clipboard"
          tone="blue"
        />
        <KpiCard
          label="Pending Approvals"
          value={stats.pending}
          icon="clock"
          tone="yellow"
        />
        <KpiCard
          label="In Progress"
          value={stats.inProgress}
          icon="trending"
          tone="black"
        />
        <KpiCard
          label="Completed"
          value={stats.completed}
          icon="checkCircle"
          tone="green"
        />
      </div>

      <SystemAlerts alerts={alerts} />

      <div className="two-col-grid">
        <PendingComplaintsTable
          complaints={complaints.filter((c) => c.status === "Pending")}
          loading={loading}
          onApprove={askApprove}
          onReject={askReject}
        />
        <RecentNotifications notifications={activeManagerNotifs} />
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
