import React from "react";

/* "Complaint Status Overview" – horizontal bars. bars = [{ label, val, color }] */
export default function StatusOverview({ bars, total }) {
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <h2 className="card-title" style={{ marginBottom: 20 }}>Complaint Status Overview</h2>
      {bars.map((s) => (
        <div key={s.label} className="status-bar-row">
          <span className="status-bar-label">{s.label}</span>
          <div className="status-bar-track">
            <div className="status-bar-fill" style={{ width: `${total ? Math.round((s.val / total) * 100) : 0}%`, background: s.color }} />
          </div>
          <span className="status-bar-val">{s.val}</span>
        </div>
      ))}
    </section>
  );
}
