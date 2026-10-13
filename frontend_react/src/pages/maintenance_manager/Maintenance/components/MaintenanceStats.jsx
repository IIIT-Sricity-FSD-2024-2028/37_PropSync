import React from "react";
import KpiCard from "../../shared/KpiCard";
import { rupees } from "../../../../services/managerService";

/* 5 stat cards incl. "Platform Fee (5%)" with the Pay Fee button.
   stats = { total, pending, paid, collected, pendingFee } */
export default function MaintenanceStats({ stats, onPayFee }) {
  const feeBtn =
    stats.pendingFee > 0 ? { label: "Pay Fee", disabled: false }
    : stats.paid > 0 ? { label: "Paid", disabled: true }
    : { label: "Pay Fee", disabled: true };
  const small = { fontSize: "1.4rem" };

  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
      <KpiCard label="Total Records" value={stats.total} icon="receipt" tone="blue" />
      <KpiCard label="Pending" value={stats.pending} icon="clock" tone="yellow" />
      <KpiCard label="Paid" value={stats.paid} icon="checkCircle" tone="green" />
      <KpiCard label="Collected (Pending Remittance)" value={rupees(stats.collected)} valueStyle={small} icon="wallet" tone="black" />
      <KpiCard label="Platform Fee (5%)" value={rupees(stats.pendingFee)} valueStyle={{ ...small, color: "#7c3aed" }} icon="bank" tone="purple">
        <button className="btn btn-sm btn-purple" style={{ marginTop: 8 }} disabled={feeBtn.disabled} onClick={onPayFee}>
          {feeBtn.label}
        </button>
      </KpiCard>
    </div>
  );
}
