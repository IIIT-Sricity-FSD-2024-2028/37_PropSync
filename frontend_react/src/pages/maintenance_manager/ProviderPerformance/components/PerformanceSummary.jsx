import React from "react";
import KpiCard from "../../shared/KpiCard";

/* 4 stat cards on Provider Performance. kpis = { total, rating, onTime, jobs } */
export default function PerformanceSummary({ kpis }) {
  return (
    <div className="kpi-grid">
      <KpiCard label="Total Providers" value={kpis.total} icon="building" tone="blue" />
      <KpiCard label="Avg Rating" value={kpis.rating} icon="star" tone="yellow" />
      <KpiCard label="Avg On-Time" value={kpis.onTime} icon="clock" tone="green" />
      <KpiCard label="Total Jobs Done" value={kpis.jobs} icon="wrench" tone="black" />
    </div>
  );
}
