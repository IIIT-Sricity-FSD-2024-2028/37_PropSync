import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import { toApiImageUrl } from "../../../services/managerService";
import {
  fetchBills,
  filterBillsByComplaint,
  selectAllBills,
} from "../../../redux/features/bills/billsSlice";
import {
  fetchComplaintById,
  selectComplaintById,
} from "../../../redux/features/complaints/complaintsSlice";
import {
  fetchEstimates,
  selectEstimatesForComplaint,
} from "../../../redux/features/estimates/estimatesSlice";
import {
  getManagerViewer,
  useServiceProviders,
} from "../shared/useManagerData";

/* complaint-details.html?id=… */
export default function ComplaintDetails() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const id = params.get("id");
  // complaint, estimates, bills and providers all come from the Redux store
  const c = useSelector((state) => selectComplaintById(state, id)) || null;
  const estimates = useSelector((state) =>
    selectEstimatesForComplaint(state, id),
  );
  const allBills = useSelector(selectAllBills);
  const bills = useMemo(
    () => filterBillsByComplaint(allBills, id),
    [allBills, id],
  );
  const { providers } = useServiceProviders();
  const [error, setError] = useState("");

  // READ: backend -> Redux
  const load = useCallback(async () => {
    if (!id) return setError("No complaint ID provided.");
    const viewer = getManagerViewer();
    try {
      await Promise.all([
        dispatch(fetchComplaintById({ viewer, id })).unwrap(),
        dispatch(fetchEstimates({ viewer, complaintId: id })).unwrap(),
      ]);
      setError("");
    } catch {
      return setError(
        `Could not load complaint #${id}. Make sure the backend is running.`,
      );
    }
    dispatch(fetchBills({ complaintId: id }));
  }, [id, dispatch]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // after approve / reject go back to the list (same as the HTML page)
  const { askApprove, askReject, modals } = useComplaintActions(() =>
    setTimeout(() => navigate(MM_PATHS.complaints), 1200),
  );

  if (error || !c) {
    return (
      <ManagerLayout
        backTo={MM_PATHS.complaints}
        backLabel="Back to Complaints"
      >
        <p style={{ padding: 24, color: error ? "red" : "#6B7280" }}>
          {error || "Loading..."}
        </p>
      </ManagerLayout>
    );
  }

  const provider = providers.find(
    (p) => Number(p.id) === Number(c.assignedProviderId),
  );
  const providerName = c.assignedProviderId
    ? provider?.name || `Provider #${c.assignedProviderId}`
    : "";
  const latestEstimate =
    estimates.find(
      (e) => e.providerId === c.assignedProviderId && e.approved === true,
    ) || estimates.find((e) => e.providerId === c.assignedProviderId);

  return (
    <ManagerLayout backTo={MM_PATHS.complaints} backLabel="Back to Complaints">
      <PageHeader
        title="Complaint Details"
        subtitle="Review the complaint, its progress and the provider's documents."
      />
      <ComplaintStepper
        status={c.status}
        applicationWorkflow={estimates.some((e) => e.selectionStatus)}
        hasApplications={estimates.some(
          (e) => e.selectionStatus === "candidate",
        )}
      />
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
          <WorkProgressCard
            status={c.status}
            submittedAt={c.submittedAt}
            deadline={c.deadline}
            providerName={providerName}
          />
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
