import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  deleteEstimate,
  fetchEstimates,
  reviewEstimate,
  selectEstimates,
} from "../../../redux/features/estimates/estimatesSlice";
import { createNotification } from "../../../redux/features/notifications/notificationsSlice";
import {
  getManagerViewer,
  useManagerComplaints,
  useServiceProviders,
} from "../shared/useManagerData";

/* service-estimate.html */
export default function ServiceEstimate() {
  const dispatch = useDispatch();
  const showToast = useToast();
  const navigate = useNavigate();
  // estimates, complaints and providers all come from the Redux store
  const reduxEstimates = useSelector(selectEstimates);
  const { complaints, reload: reloadComplaints } = useManagerComplaints();
  const { providers } = useServiceProviders();
  const complaintsById = useMemo(
    () => Object.fromEntries(complaints.map((c) => [Number(c.id), c])),
    [complaints],
  );
  const providersById = useMemo(
    () => Object.fromEntries(providers.map((p) => [Number(p.id), p.name])),
    [providers],
  );
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // READ: backend -> Redux
  const load = useCallback(async () => {
    try {
      await dispatch(fetchEstimates({ viewer: getManagerViewer() })).unwrap();
      reloadComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dispatch, reloadComplaints]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const issueOf = (e) =>
    complaintsById[Number(e.complaintId)]?.title || "Unknown Issue";
  const providerOf = (e) =>
    providersById[Number(e.providerId)] || `Provider #${e.providerId}`;
  const pending = reduxEstimates.filter(
    (e) => e.approved == null && e.selectionStatus !== "not_selected",
  );
  const history = reduxEstimates
    .filter(
      (e) =>
        e.approved === true ||
        e.approved === false ||
        e.selectionStatus === "not_selected",
    )
    .slice()
    .reverse();

  const approve = async (e) => {
    if (!complaintsById[e.complaintId]?.assignedProviderId)
      return navigate(MM_PATHS.complaintDetails(e.complaintId));
    setBusyId(e.id);
    try {
      // UPDATE: backend first; the slice stores the reviewed estimate
      const viewer = getManagerViewer();
      await dispatch(
        reviewEstimate({ viewer, id: e.id, approved: true }),
      ).unwrap();
      // notifications: saved by the backend, then added to Redux
      dispatch(
        createNotification({
          data: {
            userId: Number(e.providerId),
            complaintId: Number(e.complaintId),
            message: `Your estimate for Complaint #${e.complaintId} has been approved.`,
            type: "estimate_approved",
            recipient: "service_provider",
          },
          sender: viewer,
        }),
      );
      dispatch(
        createNotification({
          data: {
            userId: Number(complaintsById[e.complaintId]?.ownerId || 1),
            complaintId: Number(e.complaintId),
            message: `Estimate for complaint #${e.complaintId} has been approved by the Maintenance Manager.`,
            type: "estimate_approved",
            recipient: "owner",
          },
          sender: viewer,
        }),
      );

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
      // UPDATE: backend first (it also notifies the provider)
      await dispatch(
        reviewEstimate({
          viewer: getManagerViewer(),
          id: rejecting.id,
          approved: false,
          managerNote: reason,
        }),
      ).unwrap();

      showToast(`Estimate ${rejecting.id} rejected.`);
      setRejecting(null);
      await load();
    } catch (err) {
      showToast("Error: " + (err.message || "Could not reject"));
    }
  };

  const handleDelete = async (estimateId) => {
    if (
      !window.confirm(
        `Are you sure you want to delete estimate #${estimateId}?`,
      )
    )
      return;
    // DELETE: the estimate leaves Redux only after the backend deletes it
    try {
      await dispatch(
        deleteEstimate({ viewer: getManagerViewer(), id: estimateId }),
      ).unwrap();
      showToast(`Estimate ${estimateId} deleted successfully.`);
    } catch (err) {
      showToast(
        `Could not delete estimate ${estimateId}: ${err.message || "Unknown error"}`,
      );
    }
    await load();
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader
        title="Service Estimate Approval"
        subtitle="Review and approve or reject the cost estimates submitted by service providers."
      />
      <h2 className="section-title">
        Pending Estimates <span className="count-pill">{pending.length}</span>
      </h2>
      {loading ? (
        <div className="card muted">Loading...</div>
      ) : pending.length === 0 ? (
        <div className="card empty-state">
          <Icon name="checkCircle" size={56} strokeWidth={1.5} />
          <h3>All estimates have been reviewed</h3>
          <p>
            New estimates submitted by service providers will appear here
            automatically.
          </p>
        </div>
      ) : (
        pending.map((e) => (
          <PendingEstimateCard
            key={e.id}
            estimate={e}
            issue={issueOf(e)}
            provider={providerOf(e)}
            approveLabel={
              complaintsById[e.complaintId]?.assignedProviderId
                ? "Approve Estimate"
                : "Compare Providers in Complaint"
            }
            busy={busyId === e.id}
            onApprove={() => approve(e)}
            onReject={() => setRejecting(e)}
          />
        ))
      )}

      <EstimateHistory
        history={history}
        issueOf={issueOf}
        providerOf={providerOf}
        onDelete={handleDelete}
      />

      <RejectModal
        key={rejecting?.id ?? "none"}
        open={!!rejecting}
        title="Reject Estimate"
        targetId={
          rejecting ? `#${rejecting.id} (C-${rejecting.complaintId})` : ""
        }
        note="This reason will be sent to the service provider."
        onClose={() => setRejecting(null)}
        onSubmit={reject}
      />
    </ManagerLayout>
  );
}
