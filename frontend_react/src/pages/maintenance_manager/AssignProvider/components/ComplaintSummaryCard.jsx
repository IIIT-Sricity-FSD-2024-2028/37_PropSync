import React from "react";
import { PriorityBadge } from "../../shared/Badges";
import Icon from "../../shared/Icon";
import { PRIORITY_LABEL } from "../../../../services/managerService";

/* Complaint summary at the top of Assign Provider */
export default function ComplaintSummaryCard({ complaint }) {
  return (
    <section className="card">
      <p className="detail-label"><span className="detail-label-bar" /> Complaint Details</p>
      {complaint ? (
        <>
          <div className="estimate-badges">
            <span className="badge badge-id">#{complaint.id}</span>
            {complaint.category && <span className="badge badge-dark">{complaint.category}</span>}
            <PriorityBadge priority={PRIORITY_LABEL[complaint.priority] || complaint.priority} />
          </div>
          <h3 style={{ marginBottom: 6 }}>{complaint.title}</h3>
          <p className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="mapPin" size={14} /> {complaint.location || "—"}
          </p>
        </>
      ) : (
        <p className="muted">Loading complaint...</p>
      )}
    </section>
  );
}
