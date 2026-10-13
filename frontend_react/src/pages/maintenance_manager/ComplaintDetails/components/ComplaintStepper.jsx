import React from "react";
import Icon from "../../shared/Icon";

const STEP_LABELS = ["Submitted", "Approved", "Provider Assigned", "Estimate Submitted", "Work in Progress", "Completed"];
const STEP_INDEX = { pending: 0, approved: 1, assigned: 2, estimating_cost: 3, in_progress: 4, completed: 5, billed: 5, paid: 5, closed: 5, payment_pending: 5, rejected: 0 };

/* 6-step progress bar at the top of Complaint Details */
export default function ComplaintStepper({ status }) {
  const si = STEP_INDEX[status] || 0;
  return (
    <section className="card">
      <div className="stepper" style={{ marginBottom: 0 }}>
        {STEP_LABELS.map((s, i) => (
          <div key={s} className={`step ${i < si ? "done" : i === si ? "current" : ""}`}>
            <div className="step-circle">{i < si ? <Icon name="check" size={18} /> : i + 1}</div>
            <div className="step-label">{s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
