import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useDispatch } from "react-redux";
import { useToast } from "../../shared/Toast";
import RejectModal from "../../shared/RejectModal";
import ComplaintSummaryCard from "./ComplaintSummaryCard";
import DueDateCard from "./DueDateCard";
import ProviderNotesCard from "./ProviderNotesCard";
import ProviderQueue from "./ProviderQueue";
import { MM_PATHS } from "../../shared/paths";
import { assignProvider, fetchComplaint, fetchProviderQueue, reviewEstimate, deleteEstimate as deleteEstimateApi } from "../../../../services/managerService";
import {
  selectEstimate as selectEstimateAction,
  reviewEstimate as reviewEstimateAction,
  deleteEstimate as deleteEstimateAction,
} from "../../../../redux/features/estimates/estimatesSlice";
import {
  notifyEstimateApproved,
  notifyEstimateRejected,
} from "../../../../redux/features/notifications/notificationsSlice";
import { createNotification } from "../../../../services/notificationService";

export default function ProviderSelection({ complaintId, onUpdated }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dispatch = useDispatch();
  const showToast = useToast();
  const [complaint, setComplaint] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const back = () => navigate(`${MM_PATHS.complaints}?tab=approved`);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, result] = await Promise.all([fetchComplaint(complaintId), fetchProviderQueue(complaintId)]);
      setComplaint(c);
      setDueDate(c.deadline || "");
      setQueue([...(result.applications || []).map(a => ({ ...a.provider, estimate: a.estimate })), ...(result.legacyProviders || [])]);
    } catch (err) { setError(err.message || "Could not load provider estimates."); }
    finally { setLoading(false); }
  }, [complaintId]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  async function confirm() {
    if (lock.current) return;
    if (!selectedId) return showToast("Please select a provider.");
    if (!dueDate) return showToast("Please set a due date.");
    lock.current = true;
    setBusy(true);
    try {
      await assignProvider(complaintId, selectedId, { deadline: dueDate, managerNote: notes });
      const matched = queue.find((p) => Number(p.id) === Number(selectedId));
      if (matched?.estimate?.id) {
        dispatch(selectEstimateAction({ id: matched.estimate.id, complaintId, managerNote: notes }));
      }
      dispatch(notifyEstimateApproved({
        complaintId,
        title: complaint?.title || `Complaint #${complaintId}`,
        ownerId: complaint?.ownerId || 1,
        providerId: selectedId,
      }));
      createNotification({
        userId: Number(selectedId),
        complaintId: Number(complaintId),
        message: `Your estimate for Complaint #${complaintId} has been approved and assigned to you. Work can begin.`,
        type: "estimate_approved",
        recipient: "service_provider",
      }, "maintenance_manager").catch(() => {});
      createNotification({
        userId: Number(complaint?.ownerId || 1),
        complaintId: Number(complaintId),
        message: `Service provider #${selectedId} has been assigned to your complaint #${complaintId} and estimate approved.`,
        type: "provider_assigned",
        recipient: "owner",
      }, "maintenance_manager").catch(() => {});

      showToast("Provider and estimate approved. Work can begin.");
      setSelectedId(null);
      await load();
      onUpdated?.();
    } catch (err) { showToast("Error: " + err.message); }
    finally { lock.current = false; setBusy(false); }
  }

  async function reject(reason) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await reviewEstimate(rejecting.id, false, reason);
      dispatch(reviewEstimateAction({ id: rejecting.id, approved: false, managerNote: reason }));
      dispatch(notifyEstimateRejected({
        complaintId: rejecting.complaintId || complaintId,
        title: complaint?.title || `Complaint #${complaintId}`,
        providerId: rejecting.providerId,
        reason,
      }));
      // Note: Backend reviewEstimate already calls notifyEstimateRejected, so we do not call createNotification to prevent duplicate notifications.

      if (selectedId === rejecting.providerId) setSelectedId(null);
      setRejecting(null);
      showToast("Estimate rejected. Other candidates remain available.");
      await load();
      onUpdated?.();
    } catch (err) { showToast("Error: " + err.message); }
    finally { lock.current = false; setBusy(false); }
  }

  async function handleDeleteEstimate(estimateId) {
    if (!window.confirm(`Are you sure you want to delete estimate #${estimateId}?`)) return;
    try {
      await deleteEstimateApi(estimateId);
      dispatch(deleteEstimateAction(estimateId));
      showToast(`Estimate #${estimateId} deleted successfully.`);
      await load();
      onUpdated?.();
    } catch {
      dispatch(deleteEstimateAction(estimateId));
      showToast(`Estimate #${estimateId} removed.`);
      await load();
      onUpdated?.();
    }
  }

  return <>
    {error && <div className="card" role="alert">{error} <button className="btn btn-ghost" onClick={load}>Retry</button></div>}
    <div className="two-col-grid" style={{ alignItems: "start", marginTop: 24 }}>
      <ProviderQueue
        providers={queue}
        loading={loading}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onUnselect={() => setSelectedId(null)}
        onReject={setRejecting}
        busy={busy}
        onBack={back}
      />
      <div>
        <ComplaintSummaryCard complaint={complaint} />
        {complaint?.status === "approved" && <section className="card">
          <p className="detail-label"><span className="detail-label-bar" /> Assignment</p>
          <div style={{ display: "grid", gap: 20 }}>
            <DueDateCard value={dueDate} onChange={setDueDate} />
            <ProviderNotesCard value={notes} onChange={setNotes} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" disabled={busy} onClick={back}>Cancel</button>
            <button className="btn btn-success" disabled={busy || loading || !!error || !selectedId} onClick={confirm}>
              {busy ? "Approving..." : "Approve Provider & Estimate"}
            </button>
          </div>
        </section>}
      </div>
    </div>
    <RejectModal key={rejecting?.id || "none"} open={!!rejecting} title="Reject Estimate"
      targetId={rejecting ? `#${rejecting.id}` : ""} note="Only this provider's estimate will be rejected."
      onClose={() => { if (!busy) setRejecting(null); }} onSubmit={reject} />
  </>;
}
