import React from "react";
import EmptyRow from "../../shared/EmptyRow";
import { getOwnerDisplay, money } from "../../../../services/managerService";

/* "Payment Records" table – rows come from the Redux payments slice */
export default function PaymentRecordsTable({ payments, loading, error, issueOf }) {
  const emptyText = error ? `Could not load payment records. ${error}` : loading ? "Loading..." : "No payment records yet.";
  return (
    <section className="card" style={{ marginTop: 32 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">Payment Records</h2>
          <p className="card-subtitle">Payments recorded against service bills</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Payment ID</th><th>Bill ID</th><th>Issue</th><th>Owner</th><th>Amount</th><th>Paid On</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <EmptyRow colSpan={7} text={emptyText} color={error ? "#DC2626" : undefined} />
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>#{p.billId}</td>
                  <td>{issueOf(p)}</td>
                  <td>{getOwnerDisplay(p.ownerId).name}</td>
                  <td style={{ color: "#42a443", fontWeight: 700 }}>{money(p.amount)}</td>
                  <td>{p.paidAt || "—"}</td>
                  <td>{p.receiptImage ? <a href={p.receiptImage} target="_blank" rel="noreferrer">View</a> : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
