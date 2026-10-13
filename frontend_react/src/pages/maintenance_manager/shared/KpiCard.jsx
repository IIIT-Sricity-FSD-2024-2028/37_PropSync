import React from "react";
import Icon from "./Icon";

/* Stat card (same look as the Service Provider dashboard cards).
   icon = Icon name, tone = blue | yellow | green | black | red | purple
   highlight = true → amber border + "Click to review →" (use with onClick) */
export default function KpiCard({ label, value, icon = "clipboard", tone = "blue", valueStyle, highlight, onClick, children }) {
  return (
    <div className={`kpi-card${onClick ? " clickable" : ""}${highlight ? " highlight" : ""}`} onClick={onClick}>
      <div style={{ minWidth: 0 }}>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value" style={valueStyle}>{value}</p>
        {highlight && <p className="kpi-hint">Click to review →</p>}
        {children}
      </div>
      <div className={`kpi-icon tone-${tone}`}>
        <Icon name={icon} size={22} />
      </div>
    </div>
  );
}
