import React from "react";
import KpiCard from "../../shared/KpiCard";
import { money } from "../../../../services/managerService";

/* 3 stat cards on the bills page */
export default function BillsSummary({ pendingTotal, paidTotal, count }) {
  return (
    <div className="grid-3" style={{ marginBottom: 32 }}>
      <KpiCard label="Pending Payment" value={money(pendingTotal)} icon="clock" tone="yellow" />
      <KpiCard label="Total Paid" value={money(paidTotal)} icon="checkCircle" tone="green" />
      <KpiCard label="Total Bills" value={count} icon="receipt" tone="black" />
    </div>
  );
}
