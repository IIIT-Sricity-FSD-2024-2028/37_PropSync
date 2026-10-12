import React from "react";
import Icon from "../../shared/Icon";

const PROGRESS = { pending: 0, approved: 25, assigned: 35, estimating_cost: 50, in_progress: 65, completed: 80, billed: 85, paid: 95, closed: 100, payment_pending: 100, rejected: 0 };

/* "Work Progress" bar + submitted / due / provider */
export default function WorkProgressCard({ status, submittedAt, deadline, providerName }) {
  const pct = PROGRESS[status] || 0;
  const items = [
    ["calendar", "Submitted On", submittedAt || "—"],
    ["clock", "Due Date", deadline || "—"],
    ["user", "Service Provider", providerName || "Not assigned"],
  ];
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="card-title" style={{ marginBottom: 12 }}>Work Progress</h2>
        <span className="progress-pct-label">{pct}%</span>
      </div>
      <div className="work-progress-bar-wrap">
        <div className="work-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="work-meta">
        {items.map(([icon, label, value]) => (
          <div key={label} className="detail-box">
            <Icon name={icon} size={18} />
            <div>
              <p className="work-meta-label">{label}</p>
              <p className="work-meta-value">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
