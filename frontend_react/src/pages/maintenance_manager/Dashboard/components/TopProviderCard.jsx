import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* "Top Provider" card. provider = { name, category, jobs } | null */
export default function TopProviderCard({ provider }) {
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <h2 className="card-title" style={{ marginBottom: 12 }}>Top Provider</h2>
      {provider ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="medal">{provider.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <p style={{ fontWeight: 700 }}>{provider.name}</p>
            <p className="muted">
              {provider.category || "General"} · {provider.jobs} completed job{provider.jobs === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      ) : (
        <p className="muted">No provider data yet</p>
      )}
      <Link to={MM_PATHS.providerPerformance} className="btn-link" style={{ marginTop: 16 }}>
        View All Providers <Icon name="arrowRight" size={16} />
      </Link>
    </section>
  );
}
