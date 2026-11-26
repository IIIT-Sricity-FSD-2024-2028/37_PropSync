import PendingEstimateCard from "../../ServiceEstimate/components/PendingEstimateCard";

export default function ProviderQueueItem({ provider, selected, onSelect, onUnselect, onReject, busy }) {
  const { estimate, ...p } = provider;
  const eligible = estimate && (estimate.approved === null || estimate.isEdited) && (!estimate.selectionStatus || estimate.selectionStatus === "candidate");
  if (!estimate) return <div className="provider-rec-card"><div>
    <strong>{p.name}</strong><p className="muted">Legacy interest - awaiting an estimate before selection.</p>
  </div></div>;
  return (
    <PendingEstimateCard
      estimate={estimate}
      provider={p.name}
      issue={p.category || "General"}
      details={[p.phone, `Provider ID: ${p.id}`].filter(Boolean).join(" · ")}
      selected={selected}
      busy={busy}
      approveLabel="Select Provider"
      onApprove={eligible ? () => (selected ? onUnselect?.() : onSelect(p.id)) : undefined}
      onUnselect={selected ? onUnselect : undefined}
      onReject={eligible ? () => onReject(estimate) : undefined}
    />
  );
}
