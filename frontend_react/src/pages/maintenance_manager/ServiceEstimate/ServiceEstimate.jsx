import React, { useCallback, useEffect, useState } from "react";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import Icon from "../shared/Icon";
import RejectModal from "../shared/RejectModal";
import { useToast } from "../shared/Toast";
import PendingEstimateCard from "./components/PendingEstimateCard";
import EstimateHistory from "./components/EstimateHistory";
import { MM_PATHS } from "../shared/paths";
import { fetchComplaints, fetchEstimates, fetchProviders, reviewEstimate } from "../../../services/managerService";

/* service-estimate.html */
export default function ServiceEstimate() {
  const showToast = useToast();
  const [estimates, setEstimates] = useState([]);
  const [complaintsById, setComplaintsById] = useState({});
  const [providersById, setProvidersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [comps, ests] = await Promise.all([fetchComplaints(), fetchEstimates()]);
      setComplaintsById(Object.fromEntries(comps.map((c) => [Number(c.id), c])));
      setEstimates(ests.filter((e) => comps.some((c) => Number(c.id) === Number(e.complaintId))));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchProviders().then((l) => setProvidersById(Object.fromEntries(l.map((p) => [Number(p.id), p.name])))).catch(() => {});
  }, [load]);

  const issueOf = (e) => complaintsById[Number(e.complaintId)]?.title || "Unknown Issue";
  const providerOf = (e) => providersById[Number(e.providerId)] || `Provider #${e.providerId}`;
  const pending = estimates.filter((e) => e.approved === null || e.approved === undefined);
  const history = estimates.filter((e) => e.approved === true || e.approved === false).reverse();

  const approve = async (e) => {
    setBusyId(e.id);
    try {
      await reviewEstimate(e.id, true);
      showToast(`Estimate ${e.id} approved. Provider notified.`);
      load();
    } catch (err) {
      showToast("Error: " + (err.message || "Could not approve"));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (reason) => {
    try {
      await reviewEstimate(rejecting.id, false, reason);
      showToast(`Estimate ${rejecting.id} rejected.`);
      setRejecting(null);
      load();
    } catch (err) {
      showToast("Error: " + (err.message || "Could not reject"));
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
            busy={busyId === e.id} onApprove={() => approve(e)} onReject={() => setRejecting(e)} />
        ))
      )}

      <EstimateHistory history={history} issueOf={issueOf} providerOf={providerOf} />

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
