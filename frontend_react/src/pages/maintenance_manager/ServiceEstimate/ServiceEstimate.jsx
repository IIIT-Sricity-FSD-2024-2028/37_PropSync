import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import Icon from "../shared/Icon";
import RejectModal from "../shared/RejectModal";
import { useToast } from "../shared/Toast";
import PendingEstimateCard from "./components/PendingEstimateCard";
import EstimateHistory from "./components/EstimateHistory";
import { MM_PATHS } from "../shared/paths";
import { fetchComplaints, fetchEstimates, fetchProviders, reviewEstimate, deleteEstimate as deleteEstimateApi } from "../../../services/managerService";
import {
  setEstimates as setEstimatesAction,
  reviewEstimate as reviewEstimateAction,
  selectEstimate as selectEstimateAction,
  deleteEstimate as deleteEstimateAction,
} from "../../../redux/features/estimates/estimatesSlice";
import {
  notifyEstimateApproved,
  notifyEstimateRejected,
} from "../../../redux/features/notifications/notificationsSlice";
import { createNotification } from "../../../services/notificationService";

/* service-estimate.html */
export default function ServiceEstimate() {
  const dispatch = useDispatch();
  const showToast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxEstimates = useSelector((state) => state.estimates);
  const [complaintsById, setComplaintsById] = useState({});
  const [providersById, setProvidersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [comps, ests] = await Promise.all([fetchComplaints(), fetchEstimates()]);
      setComplaintsById(Object.fromEntries(comps.map((c) => [Number(c.id), c])));
      dispatch(setEstimatesAction(ests));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    fetchProviders().then((l) => setProvidersById(Object.fromEntries(l.map((p) => [Number(p.id), p.name])))).catch(() => {});
    return () => clearTimeout(timer);
  }, [load]);

  const issueOf = (e) => complaintsById[Number(e.complaintId)]?.title || "Unknown Issue";
  const providerOf = (e) => providersById[Number(e.providerId)] || `Provider #${e.providerId}`;
  const pending = reduxEstimates.filter((e) => e.approved == null && e.selectionStatus !== "not_selected");
  const history = reduxEstimates.filter((e) => e.approved === true || e.approved === false || e.selectionStatus === "not_selected").slice().reverse();

  const approve = async (e) => {
    if (!complaintsById[e.complaintId]?.assignedProviderId) return navigate(MM_PATHS.complaintDetails(e.complaintId));
    setBusyId(e.id);
    try {
      await reviewEstimate(e.id, true);
      dispatch(reviewEstimateAction({ id: e.id, approved: true }));
      dispatch(selectEstimateAction({ id: e.id, complaintId: e.complaintId }));
      dispatch(notifyEstimateApproved({
        complaintId: e.complaintId,
        title: issueOf(e),
        ownerId: complaintsById[e.complaintId]?.ownerId || 1,
        providerId: e.providerId,
      }));
      createNotification({
        userId: Number(e.providerId),
        complaintId: Number(e.complaintId),
        message: `Your estimate for Complaint #${e.complaintId} has been approved.`,
        type: "estimate_approved",
        recipient: "service_provider",
      }, "maintenance_manager").catch(() => {});
      createNotification({
        userId: Number(complaintsById[e.complaintId]?.ownerId || 1),
        complaintId: Number(e.complaintId),
        message: `Estimate for complaint #${e.complaintId} has been approved by the Maintenance Manager.`,
        type: "estimate_approved",
        recipient: "owner",
      }, "maintenance_manager").catch(() => {});

      showToast(`Estimate ${e.id} approved. Provider notified.`);
      await load();
    } catch (err) {
      showToast("Error: " + (err.message || "Could not approve"));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (reason) => {
    try {
      await reviewEstimate(rejecting.id, false, reason);
      dispatch(reviewEstimateAction({ id: rejecting.id, approved: false, managerNote: reason }));
      dispatch(notifyEstimateRejected({
        complaintId: rejecting.complaintId,
        title: issueOf(rejecting),
        providerId: rejecting.providerId,
        reason,
      }));
      // Note: Backend reviewEstimate already calls notifyEstimateRejected, so we do not call createNotification to avoid duplicate notifications.

      showToast(`Estimate ${rejecting.id} rejected.`);
      setRejecting(null);
      await load();
    } catch (err) {
      showToast("Error: " + (err.message || "Could not reject"));
    }
  };

  const handleDelete = async (estimateId) => {
    if (!window.confirm(`Are you sure you want to delete estimate #${estimateId}?`)) return;
    try {
      await deleteEstimateApi(estimateId);
      dispatch(deleteEstimateAction(estimateId));
      showToast(`Estimate ${estimateId} deleted successfully.`);
      await load();
    } catch {
      dispatch(deleteEstimateAction(estimateId));
      showToast(`Estimate ${estimateId} removed.`);
      await load();
    }
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Service Estimate Approval" subtitle="Review and approve or reject the cost estimates submitted by service providers." />
      <h2 className="section-title">Pending Estimates <span className="count-pill">{pending.length}</span></h2>
      {loading ? (
        <div className="card muted">Loading...</div>
      ) : pending.length === 0 ? (
        <div className="card empty-state">
          <Icon name="checkCircle" size={56} strokeWidth={1.5} />
          <h3>All estimates have been reviewed</h3>
          <p>New estimates submitted by service providers will appear here automatically.</p>
        </div>
      ) : (
        pending.map((e) => (
          <PendingEstimateCard key={e.id} estimate={e} issue={issueOf(e)} provider={providerOf(e)}
            approveLabel={complaintsById[e.complaintId]?.assignedProviderId ? "Approve Estimate" : "Compare Providers in Complaint"} busy={busyId === e.id} onApprove={() => approve(e)} onReject={() => setRejecting(e)} />
        ))
      )}

      <EstimateHistory history={history} issueOf={issueOf} providerOf={providerOf} onDelete={handleDelete} />

      <RejectModal
        key={rejecting?.id ?? "none"}
        open={!!rejecting}
        title="Reject Estimate"
        targetId={rejecting ? `#${rejecting.id} (C-${rejecting.complaintId})` : ""}
        note="This reason will be sent to the service provider."
        onClose={() => setRejecting(null)}
        onSubmit={reject}
      />
    </ManagerLayout>
  );
}
