import React from "react";
import Icon from "../../shared/Icon";

const LIFECYCLE = ["Complaint Submitted", "Complaint Approved", "Service Provider Assigned", "Estimate Submitted", "Estimate Approved", "Work In Progress", "Work Completed", "Payment Processed"];
const LIFECYCLE_INDEX = { pending: 0, approved: 1, assigned: 2, estimating_cost: 3, in_progress: 5, completed: 6, billed: 7, paid: 7, closed: 7, payment_pending: 7, rejected: 0 };

/* "Complaint Lifecycle" tracker (same style as the SP progress tracker) */
export default function LifecycleCard({ status, submittedAt }) {
  const current = LIFECYCLE_INDEX[status] ?? 0;
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <h2 className="card-title" style={{ marginBottom: 20 }}>Complaint Lifecycle</h2>
      {LIFECYCLE.map((s, i) => (
        <div key={s}>
          <div className="lifecycle-item">
            <div className={`lifecycle-icon ${i <= current ? "active" : ""}`}>
              <Icon name={i <= current ? "check" : "clock"} size={16} />
            </div>
            <div>
              <p className={`lifecycle-text ${i <= current ? "active" : ""}`}>
                {s}
                {i === current && <span className="badge badge-approved" style={{ marginLeft: 8, padding: "1px 8px" }}>Current</span>}
              </p>
              {i === 0 && <p className="lifecycle-date">{submittedAt || "—"}</p>}
            </div>
          </div>
          {i < LIFECYCLE.length - 1 && <div className={`lifecycle-connector ${i < current ? "active" : ""}`} />}
        </div>
      ))}
    </section>
  );
}
