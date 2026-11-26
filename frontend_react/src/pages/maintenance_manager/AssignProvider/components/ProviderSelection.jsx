import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../shared/Toast";
import RejectModal from "../../shared/RejectModal";
import ComplaintSummaryCard from "./ComplaintSummaryCard";
import DueDateCard from "./DueDateCard";
import ProviderNotesCard from "./ProviderNotesCard";
import ProviderQueue from "./ProviderQueue";
import { MM_PATHS } from "../../shared/paths";
import {
  assignProvider,
  fetchComplaintById,
  fetchProviderQueue,
  selectComplaintById,
  selectProviderQueue,
} from "../../../../redux/features/complaints/complaintsSlice";
import {
  deleteEstimate,
  reviewEstimate,
} from "../../../../redux/features/estimates/estimatesSlice";
import { createNotification } from "../../../../redux/features/notifications/notificationsSlice";
import { getManagerViewer } from "../../shared/useManagerData";

export default function ProviderSelection({ complaintId, onUpdated }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showToast = useToast();
  // complaint and provider queue come from the Redux store
  const complaint =
    useSelector((state) => selectComplaintById(state, complaintId)) || null;
  const rawQueue = useSelector((state) =>
    selectProviderQueue(state, complaintId),
  );
  const queue = useMemo(
    () => [
      ...(rawQueue?.applications || []).map((a) => ({
        ...a.provider,
        estimate: a.estimate,
      })),
      ...(rawQueue?.legacyProviders || []),
    ],
    [rawQueue],
  );
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
    const viewer = getManagerViewer();
    try {
      const [c] = await Promise.all([
        dispatch(fetchComplaintById({ viewer, id: complaintId })).unwrap(),
        dispatch(fetchProviderQueue({ viewer, id: complaintId })).unwrap(),
      ]);
      setDueDate(c.deadline || "");
    } catch (err) {
      setError(err.message || "Could not load provider estimates.");
    } finally {
      setLoading(false);
    }
  }, [complaintId, dispatch]);
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function confirm() {
    if (lock.current) return;
    if (!selectedId) return showToast("Please select a provider.");
    if (!dueDate) return showToast("Please set a due date.");
    lock.current = true;
    setBusy(true);
    try {
      // UPDATE: backend first; the complaints slice stores the assigned complaint
      const viewer = getManagerViewer();
      await dispatch(
        assignProvider({
          viewer,
          id: complaintId,
          providerId: selectedId,
          details: { deadline: dueDate, managerNote: notes },
        }),
      ).unwrap();
      // notifications are saved by the backend, then added to Redux
      dispatch(
        createNotification({
          data: {
            userId: Number(selectedId),
            complaintId: Number(complaintId),
            message: `Your estimate for Complaint #${complaintId} has been approved and assigned to you. Work can begin.`,
            type: "estimate_approved",
            recipient: "service_provider",
          },
          sender: viewer,
        }),
      );
      dispatch(
        createNotification({
          data: {
            userId: Number(complaint?.ownerId || 1),
            complaintId: Number(complaintId),
            message: `Service provider #${selectedId} has been assigned to your complaint #${complaintId} and estimate approved.`,
            type: "provider_assigned",
            recipient: "owner",
          },
          sender: viewer,
        }),
      );

      showToast("Provider and estimate approved. Work can begin.");
      setSelectedId(null);
      await load();
      onUpdated?.();
    } catch (err) {
      showToast("Error: " + err.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function reject(reason) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      // UPDATE: backend first (it also notifies the provider); the slice stores the reviewed estimate
      await dispatch(
        reviewEstimate({
          viewer: getManagerViewer(),
          id: rejecting.id,
          approved: false,
          managerNote: reason,
        }),
      ).unwrap();

      if (selectedId === rejecting.providerId) setSelectedId(null);
      setRejecting(null);
      showToast("Estimate rejected. Other candidates remain available.");
      await load();
      onUpdated?.();
    } catch (err) {
      showToast("Error: " + err.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  // DELETE: the estimate leaves Redux only after the backend deletes it
  async function handleDeleteEstimate(estimateId) {
    if (
      !window.confirm(
        `Are you sure you want to delete estimate #${estimateId}?`,
      )
    )
      return;
    try {
      await dispatch(
        deleteEstimate({ viewer: getManagerViewer(), id: estimateId }),
      ).unwrap();
      showToast(`Estimate #${estimateId} deleted successfully.`);
    } catch (e) {
      showToast(
        `Could not delete estimate #${estimateId}: ${e.message || "Unknown error"}`,
      );
    }
    await load();
    onUpdated?.();
  }

  return (
    <>
      {error && (
        <div className="card" role="alert">
          {error}{" "}
          <button className="btn btn-ghost" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <div
        className="two-col-grid"
        style={{ alignItems: "start", marginTop: 24 }}
      >
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
          {complaint?.status === "approved" && (
            <section className="card">
              <p className="detail-label">
                <span className="detail-label-bar" /> Assignment
              </p>
              <div style={{ display: "grid", gap: 20 }}>
                <DueDateCard value={dueDate} onChange={setDueDate} />
                <ProviderNotesCard value={notes} onChange={setNotes} />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={back}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  disabled={busy || loading || !!error || !selectedId}
                  onClick={confirm}
                >
                  {busy ? "Approving..." : "Approve Provider & Estimate"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
      <RejectModal
        key={rejecting?.id || "none"}
        open={!!rejecting}
        title="Reject Estimate"
        targetId={rejecting ? `#${rejecting.id}` : ""}
        note="Only this provider's estimate will be rejected."
        onClose={() => {
          if (!busy) setRejecting(null);
        }}
        onSubmit={reject}
      />
    </>
  );
}
