import React from "react";
import Icon from "../../shared/Icon";

/* One provider in the interest queue (click to select) */
export default function ProviderQueueItem({ provider: p, index: i, selected, onSelect }) {
  const onTime = 80 + (i % 20);
  const barColor = onTime >= 90 ? "#16A34A" : onTime >= 80 ? "#F59E0B" : "#DC2626";
  const rating = (4 + ((i * 0.1) % 1)).toFixed(1);

  return (
    <div className={`provider-rec-card ${selected ? "selected" : ""}`} onClick={() => onSelect(p.id)}>
      <div className="medal">#{i + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="provider-rec-name">
          {p.name}
          <span className="specialty-tag">{p.category || "General"}</span>
          <span className="badge badge-gray">Queue #{i + 1}</span>
        </div>
        <div className="provider-rec-meta">
          <span style={{ color: "#F59E0B" }}>★</span> {rating} · {onTime}% on-time · ID {p.id}
        </div>
        <div className="progress-bar-wrap" style={{ marginTop: 8, height: 6 }}>
          <div className="progress-bar" style={{ width: `${onTime}%`, background: barColor }} />
        </div>
      </div>
      <div className={`select-check ${selected ? "on" : ""}`}>{selected && <Icon name="check" size={14} />}</div>
    </div>
  );
}
