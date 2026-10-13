import React from "react";
import ProviderQueueItem from "./ProviderQueueItem";
import Icon from "../../shared/Icon";

/* "Providers Who Expressed Interest" list, or the waiting empty-state */
export default function ProviderQueue({ providers, loading, selectedId, onSelect, onBack }) {
  const has = providers.length > 0;
  return (
    <section className="card">
      <div className="card-head" style={{ marginBottom: 20 }}>
        <h2 className="card-title">{has ? "Providers Who Expressed Interest" : "Provider Queue"}</h2>
        <span className="muted">
          {loading ? "Loading queue..." : has ? `${providers.length} in queue — select one to assign` : "No providers yet"}
        </span>
      </div>

      {!loading && !has && (
        <div className="empty-state">
          <Icon name="users" size={56} strokeWidth={1.5} />
          <h3>Waiting for provider interest</h3>
          <p>
            This complaint is visible to service providers in Available Complaints. Once a provider clicks Accept, they will
            appear here for you to select.
          </p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={onBack}>Back to Approved Complaints</button>
        </div>
      )}

      {providers.map((p, i) => (
        <ProviderQueueItem key={p.id} provider={p} index={i} selected={selectedId === p.id} onSelect={onSelect} />
      ))}
    </section>
  );
}
