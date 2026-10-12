import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import { useToast } from "../shared/Toast";
import ComplaintSummaryCard from "./components/ComplaintSummaryCard";
import DueDateCard from "./components/DueDateCard";
import ProviderNotesCard from "./components/ProviderNotesCard";
import ProviderQueue from "./components/ProviderQueue";
import AssignSuccessModal from "./components/AssignSuccessModal";
import { MM_PATHS } from "../shared/paths";
import { assignProvider, fetchComplaint, fetchProviderQueue, fetchProviders, updateComplaintStatus } from "../../../services/managerService";

const APPROVED_LIST = `${MM_PATHS.complaints}?tab=approved`;

/* assign_provider.html?id=… */
export default function AssignProvider() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const complaintId = params.get("id");

  const [complaint, setComplaint] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!complaintId) return;
    (async () => {
      fetchComplaint(complaintId).then(setComplaint).catch((e) => console.error("Failed to load complaint", e));
      const all = await fetchProviders().catch(() => []);
      const ids = (await fetchProviderQueue(complaintId).catch(() => ({}))).queue || [];
      // keep only providers in the queue, in queue order
      setQueue(all.filter((p) => ids.includes(p.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)));
      setLoading(false);
    })();
  }, [complaintId]);

  const confirm = async () => {
    if (!selectedId) return showToast("Please select a provider.");
    if (!dueDate) return showToast("Please set a due date.");
    setBusy(true);
    try {
      await assignProvider(complaintId, selectedId);
      // the HTML page also sent the due date this way; backend may reject it (already "assigned") – ignored, same as before
      await updateComplaintStatus(complaintId, { status: "assigned", deadline: dueDate }).catch(() => {});
      const p = queue.find((x) => x.id === selectedId);
      setSuccess(`${p ? p.name : "Provider"} has been assigned. Due: ${dueDate}`);
    } catch (e) {
      showToast("Error: " + (e.message || "Could not assign provider"));
    } finally {
      setBusy(false);
    }
  };

  if (!complaintId) {
    return (
      <ManagerLayout backTo={APPROVED_LIST} backLabel="Back to Approved Complaints">
        <p style={{ padding: 24, color: "red" }}>No complaint ID provided.</p>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout backTo={APPROVED_LIST} backLabel="Back to Approved Complaints">
      <PageHeader title="Assign Service Provider" subtitle="Pick a provider from the interest queue and set the due date." />
      <div className="two-col-grid" style={{ alignItems: "start" }}>
        <ProviderQueue providers={queue} loading={loading} selectedId={selectedId} onSelect={setSelectedId} onBack={() => navigate(APPROVED_LIST)} />
        <div>
          <ComplaintSummaryCard complaint={complaint} />
          <section className="card">
            <p className="detail-label"><span className="detail-label-bar" /> Assignment</p>
            <div style={{ display: "grid", gap: 20 }}>
              <DueDateCard value={dueDate} onChange={setDueDate} />
              <ProviderNotesCard value={notes} onChange={setNotes} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => navigate(APPROVED_LIST)}>Cancel</button>
              <button className="btn btn-success" disabled={busy} onClick={confirm}>
                {busy ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </section>
        </div>
      </div>

      <AssignSuccessModal
        open={!!success}
        message={success}
        onApprovedList={() => navigate(APPROVED_LIST)}
        onAllComplaints={() => navigate(MM_PATHS.complaints)}
      />
    </ManagerLayout>
  );
}
