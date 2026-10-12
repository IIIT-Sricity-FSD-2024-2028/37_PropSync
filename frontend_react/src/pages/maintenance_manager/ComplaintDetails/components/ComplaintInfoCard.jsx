import React from "react";
import { PriorityBadge } from "../../shared/Badges";
import Icon from "../../shared/Icon";
import { getOwnerDisplay, PRIORITY_LABEL, STATUS_LABEL } from "../../../../services/managerService";

function Info({ label, children, full }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <p className="info-label">{label}</p>
      <div className="info-value">{children}</div>
    </div>
  );
}

/* "Complaint Information" card (+ Approve/Reject or Assign buttons) */
export default function ComplaintInfoCard({ complaint: c, providerName, estimatedCost, onApprove, onReject, onAssign }) {
  const owner = getOwnerDisplay(c.ownerId);
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="estimate-badges">
        <span className="badge badge-id">#{c.id}</span>
        {c.category && <span className="badge badge-dark">{c.category}</span>}
        <PriorityBadge priority={PRIORITY_LABEL[c.priority] || c.priority} />
      </div>
      <h2 style={{ marginBottom: 20 }}>{c.title}</h2>
      <div className="info-grid">
        <Info label="Location" full>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="mapPin" size={14} /> {c.location || "—"}</span>
        </Info>
        <Info label="Submitted By">{`${owner.name} (${owner.unit})`}</Info>
        <Info label="Owner Email">{owner.email || "—"}</Info>
        <Info label="Submitted Date">{c.submittedAt || "—"}</Info>
        <Info label="Due Date">{c.deadline || "—"}</Info>
        <Info label="Assigned Provider">{providerName || "Not yet assigned"}</Info>
        <Info label="Current Status">{STATUS_LABEL[c.status] || c.status}</Info>
        <Info label="Estimated Cost">{estimatedCost ? `₹${estimatedCost}` : "—"}</Info>
      </div>

      {c.status === "pending" && (
        <div className="estimate-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-success" onClick={onApprove}><Icon name="check" size={16} /> Approve Complaint</button>
          <button className="btn btn-danger" onClick={onReject}><Icon name="x" size={16} /> Reject Complaint</button>
        </div>
      )}
      {c.status === "approved" && (
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-success btn-full" onClick={onAssign}><Icon name="users" size={16} /> Assign Service Provider</button>
        </div>
      )}
    </section>
  );
}
