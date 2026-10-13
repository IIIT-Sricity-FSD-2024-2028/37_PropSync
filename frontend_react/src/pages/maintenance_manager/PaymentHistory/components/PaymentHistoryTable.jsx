import React from "react";
import { Link } from "react-router-dom";
import EmptyRow from "../../shared/EmptyRow";
import { MM_PATHS } from "../../shared/paths";
import { money } from "../../../../services/managerService";

/* "Payment History" table of all bills */
export default function PaymentHistoryTable({ bills, loading, isPaid, issueOf, providerOf, onPay }) {
  return (
    <section className="card" style={{ marginTop: 32 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">Payment History</h2>
          <p className="card-subtitle">Only bills from approved estimates are visible here</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Complaint ID</th><th>Issue</th><th>Provider</th><th>Submitted</th><th>Penalty</th><th>Final Amount</th><th>Paid On</th><th>Status</th></tr>
          </thead>
          <tbody>
            {bills.length === 0 ? <EmptyRow colSpan={8} text={loading ? "Loading..." : "No service bills submitted yet."} /> : bills.map((b) => (
              <tr key={b.id}>
                <td><Link className="complaint-link" to={MM_PATHS.complaintDetails(b.complaintId)}>#{b.complaintId}</Link></td>
                <td>{issueOf(b)}</td>
                <td>{providerOf(b)}</td>
                <td>{money(b.amount)}</td>
                <td style={{ color: "#DC2626" }}>{money(b.penalty || 0)}</td>
                <td style={{ color: "#42a443", fontWeight: 700 }}>{money(b.totalAmount || b.amount)}</td>
                <td>{b.paidAt || "—"}</td>
                <td>
                  {isPaid(b) ? <span className="badge badge-completed">Paid</span>
                    : <button className="btn btn-success btn-sm" onClick={() => onPay(b)}>Mark as Paid</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
