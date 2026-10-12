import React from "react";
import Icon from "../../shared/Icon";
import EmptyRow from "../../shared/EmptyRow";
import { rupees } from "../../../../services/managerService";

function StatusPill({ status }) {
  if (status === "paid") return <span className="badge badge-completed">Paid</span>;
  if (status === "payment_submitted") return <span className="badge badge-info">Payment Submitted</span>;
  return <span className="badge badge-payment">Pending</span>;
}

/* "All Maintenance Payments" table – Mark as Paid (owner submitted txn) or Delete */
export default function MaintenancePaymentsTable({ payments, loading, error, onMarkPaid, onDelete }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">All Maintenance Payments</h2>
        <span className="muted">{payments.length} record{payments.length === 1 ? "" : "s"}</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Owner</th><th>Unit</th><th>Month</th><th>Amount</th><th>Status</th><th>Transaction ID</th><th>Paid At</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <EmptyRow text="Loading..." />
              : error ? <EmptyRow text={error} color="#DC2626" />
              : payments.length === 0 ? <EmptyRow text="No maintenance payments yet" />
              : payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.ownerName || `Owner #${p.ownerId}`}</td>
                  <td>{p.ownerUnit || "-"}</td>
                  <td>{p.month}</td>
                  <td style={{ fontWeight: 700 }}>{rupees(p.amount)}</td>
                  <td><StatusPill status={p.status} /></td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: p.transactionId ? 600 : 400 }}>{p.transactionId || "-"}</td>
                  <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "-"}</td>
                  <td>
                    {p.status === "payment_submitted"
                      ? <button className="btn btn-success btn-sm" onClick={() => onMarkPaid(p.id)}><Icon name="check" size={14} /> Mark as Paid</button>
                      : <button className="btn btn-danger btn-sm" onClick={() => onDelete(p.id)}><Icon name="trash" size={14} /> Delete</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
