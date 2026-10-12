import React from "react";
import ReviewList, { stars } from "./ReviewList";


function StatBox({ label, value, color, small }) {
  return (
    <div className="perf-stat-box">
      <div className="perf-stat-label">{label}</div>
      <div className="perf-stat-value" style={{ color, ...(small ? { fontSize: "1rem" } : {}) }}>{value}</div>
    </div>
  );
}

function ProgressRow({ label, pct, color, text }) {
  return (
    <div className="progress-row">
      <div className="progress-label">{label}</div>
      <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${pct}%`, background: color }} /></div>
      <div className="progress-pct" style={{ color }}>{text}</div>
    </div>
  );
}

/* One provider's performance card.
   p = provider + { jobs, active, rating|null, onTime|null, avgCost|null, reviews[] } */
export default function ProviderPerformanceCard({ provider: p, rank }) {
  const barColor = p.onTime === null ? "#9CA3AF" : p.onTime >= 90 ? "#16A34A" : p.onTime >= 80 ? "#F59E0B" : "#DC2626";
  const ratingText = p.rating === null ? "—" : p.rating.toFixed(1);
  const onTimeText = p.onTime === null ? "—" : `${p.onTime}%`;
  const trend = p.rating >= 4.5 ? ["Top Rated", "badge-completed"]
    : p.rating !== null && p.rating < 3.5 ? ["Needs Improvement", "badge-rejected"]
    : ["Stable", "badge-gray"];

  return (
    <div className="perf-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
          <div className="medal">#{rank + 1}</div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {p.name} <span className="specialty-tag">{p.category || "General"}</span>
            </div>
            <div className="muted" style={{ marginTop: 3 }}>
              {p.rating !== null && <span style={{ color: "#F59E0B" }}>{stars(p.rating)} </span>}
              {ratingText} • {p.jobs} completed job{p.jobs === 1 ? "" : "s"} • {p.active} active
            </div>
          </div>
        </div>
        <span className={`badge ${trend[1]}`}>{trend[0]}</span>
      </div>

      <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
        <StatBox label="Rating" value={ratingText} color="#F59E0B" />
        <StatBox label="Jobs Done" value={p.jobs} color="#42a443" />
        <StatBox label="On-Time %" value={onTimeText} color={barColor} />
        <StatBox label="Avg Cost" value={p.avgCost === null ? "—" : `₹${Math.round(p.avgCost).toLocaleString("en-IN")}`} small />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <ProgressRow label="On-Time Delivery" pct={p.onTime || 0} color={barColor} text={onTimeText} />
        <ProgressRow label="Customer Rating" pct={((p.rating || 0) / 5) * 100} color="#F59E0B" text={`${ratingText}/5`} />
      </div>

      <ReviewList reviews={p.reviews} />
    </div>
  );
}
