import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import Tabs from "../shared/Tabs";
import ComplaintFilters from "./components/ComplaintFilters";
import ComplaintsTable from "./components/ComplaintsTable";
import useComplaintActions from "../shared/useComplaintActions";
import { MM_PATHS } from "../shared/paths";
import { fetchComplaints, mapComplaint } from "../../../services/managerService";

const TABS = [
  { id: "all", label: "All", statuses: null },
  { id: "pending", label: "Pending", statuses: ["Pending"] },
  { id: "approved", label: "Approved", statuses: ["Approved"] },
  { id: "inprogress", label: "In Progress", statuses: ["Assigned", "Estimating Cost", "In Progress"] },
  { id: "completed", label: "Completed", statuses: ["Completed", "Paid", "Closed"] },
  { id: "payment", label: "Pending Payment", statuses: ["Billed"] },
  { id: "rejected", label: "Rejected", statuses: ["Rejected"] },
];

/* complaints.html  (approved-complaints.html = ?tab=approved) */
export default function Complaints() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "all";
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");

  const load = useCallback(async () => {
    try {
      setComplaints((await fetchComplaints()).map(mapComplaint));
      setError("");
    } catch (e) {
      setError(e.message || "Could not load complaints. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const { askApprove, askReject, modals } = useComplaintActions(load);

  const rows = useMemo(() => {
    const want = TABS.find((t) => t.id === tab).statuses;
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (q && !c.id.toLowerCase().includes(q) && !c.issue.toLowerCase().includes(q)) return false;
      if (priority && c.priority !== priority) return false;
      return !want || want.includes(c.status);
    });
  }, [complaints, tab, search, priority]);

  const pendingCount = complaints.filter((c) => c.status === "Pending").length;

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Complaint Requests" subtitle="View and manage all maintenance complaint requests raised by owners." />
      <ComplaintFilters search={search} onSearch={setSearch} priority={priority} onPriority={setPriority} />
      <p className="result-count">{rows.length} complaint{rows.length === 1 ? "" : "s"} found</p>
      <div className="tabs-container">
        <Tabs
          tabs={TABS.map((t) => ({ ...t, count: t.id === "pending" ? pendingCount : 0 }))}
          active={tab}
          onChange={(id) => setParams(id === "all" ? {} : { tab: id })}
        />
        <ComplaintsTable tab={tab} rows={rows} loading={loading} error={error} onApprove={askApprove} onReject={askReject} />
      </div>
      {modals}
    </ManagerLayout>
  );
}
