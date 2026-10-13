import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import ComplaintStepper from "./components/ComplaintStepper";
import ComplaintInfoCard from "./components/ComplaintInfoCard";
import LifecycleCard from "./components/LifecycleCard";
import WorkProgressCard from "./components/WorkProgressCard";
import TimelineCard from "./components/TimelineCard";
import DescriptionCard from "./components/DescriptionCard";
import ProviderDocumentsCard from "./components/ProviderDocumentsCard";
import PhotoCard from "./components/PhotoCard";
import useComplaintActions from "../shared/useComplaintActions";
import { MM_PATHS } from "../shared/paths";
import { fetchBills, fetchComplaint, fetchEstimates, fetchProviders, toApiImageUrl } from "../../../services/managerService";

/* complaint-details.html?id=… */
export default function ComplaintDetails() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [c, setC] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [bills, setBills] = useState([]);
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return setError("No complaint ID provided.");
    try {
      setC(await fetchComplaint(id));
    } catch {
      return setError(`Could not load complaint #${id}. Make sure the backend is running.`);
    }
    fetchEstimates(id).then(setEstimates).catch(() => {});
    fetchBills().then((all) => setBills(all.filter((b) => Number(b.complaintId) === Number(id)))).catch(() => {});
    fetchProviders().then(setProviders).catch(() => {});
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // after approve / reject go back to the list (same as the HTML page)
  const { askApprove, askReject, modals } = useComplaintActions(() => setTimeout(() => navigate(MM_PATHS.complaints), 1200));

  if (error || !c) {
    return (
      <ManagerLayout backTo={MM_PATHS.complaints} backLabel="Back to Complaints">
        <p style={{ padding: 24, color: error ? "red" : "#6B7280" }}>{error || "Loading..."}</p>
      </ManagerLayout>
    );
  }

  const provider = providers.find((p) => Number(p.id) === Number(c.assignedProviderId));
  const providerName = c.assignedProviderId ? provider?.name || `Provider #${c.assignedProviderId}` : "";
  const latestEstimate = estimates[estimates.length - 1];

  return (
    <ManagerLayout backTo={MM_PATHS.complaints} backLabel="Back to Complaints">
      <PageHeader title="Complaint Details" subtitle="Review the complaint, its progress and the provider's documents." />
      <ComplaintStepper status={c.status} />
      <div className="two-col-grid" style={{ alignItems: "start" }}>
        <div>
          <ComplaintInfoCard
            complaint={c}
            providerName={providerName}
            estimatedCost={latestEstimate?.estimatedCost}
            onApprove={() => askApprove(c.id)}
            onReject={() => askReject(c.id)}
            onAssign={() => navigate(MM_PATHS.assignProvider(c.id))}
          />
          <div style={{ height: 24 }} />
          <WorkProgressCard status={c.status} submittedAt={c.submittedAt} deadline={c.deadline} providerName={providerName} />
          <TimelineCard complaint={c} providerName={providerName} />
          <DescriptionCard description={c.description} />
          <ProviderDocumentsCard estimate={latestEstimate} bills={bills} />
          <PhotoCard url={toApiImageUrl(c.photo)} alt={c.title} />
        </div>
        <LifecycleCard status={c.status} submittedAt={c.submittedAt} />
      </div>
      {modals}
    </ManagerLayout>
  );
}
