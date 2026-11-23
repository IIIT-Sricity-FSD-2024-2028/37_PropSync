import { useSearchParams } from "react-router-dom";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import ProviderSelection from "./components/ProviderSelection";
import { MM_PATHS } from "../shared/paths";

export default function AssignProvider() {
  const [params] = useSearchParams();
  const id = params.get("id");
  return <ManagerLayout backTo={`${MM_PATHS.complaints}?tab=approved`} backLabel="Back to Approved Complaints">
    <PageHeader title="Assign Service Provider" subtitle="Compare provider estimates, select a provider and approve their estimate together." />
    {id ? <ProviderSelection complaintId={id} /> : <p role="alert">No complaint ID provided.</p>}
  </ManagerLayout>;
}
