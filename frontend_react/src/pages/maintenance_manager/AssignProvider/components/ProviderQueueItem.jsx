import PendingEstimateCard from "../../ServiceEstimate/components/PendingEstimateCard";

export default function ProviderQueueItem({ provider, selected, onSelect, onReject, busy }) {
  const { estimate, ...p } = provider;
  const eligible = estimate && estimate.approved === null && (!estimate.selectionStatus || estimate.selectionStatus === "candidate");
  if (!estimate) return <div className="provider-rec-card"><div>
    <strong>{p.name}</strong><p className="muted">Legacy interest - awaiting an estimate before selection.</p>
  </div></div>;
  return <PendingEstimateCard estimate={estimate} provider={p.name} issue={p.category || "General"}
    details={[p.phone, `Provider ID: ${p.id}`].filter(Boolean).join(" \u00b7 ")} selected={selected} busy={busy}
    approveLabel={selected ? "Provider Selected" : "Select Provider"}
    onApprove={eligible ? () => onSelect(p.id) : undefined}
    onReject={eligible ? () => onReject(estimate) : undefined} />;
}
