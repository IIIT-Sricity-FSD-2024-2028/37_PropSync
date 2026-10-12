import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* One pending estimate: issue, provider, cost, notes, document, Approve / Reject */
export default function PendingEstimateCard({ estimate: e, issue, provider, busy, onApprove, onReject }) {
  return (
    <div className="estimate-card">
      <div className="estimate-header">
        <div style={{ minWidth: 0 }}>
          <div className="estimate-badges">
            <Link to={MM_PATHS.complaintDetails(e.complaintId)} className="badge badge-id">#{e.complaintId}</Link>
            <span className="badge badge-pending">Awaiting Review</span>
          </div>
          <p className="estimate-issue">{issue}</p>
          <p className="estimate-provider">
            Provider: <span>{provider}</span> · Submitted {e.submittedAt || "—"}
          </p>
        </div>
        <div className="estimate-cost">
          ₹{Number(e.estimatedCost).toLocaleString("en-IN")}
          <small>Estimated cost</small>
        </div>
      </div>
      <div className="estimate-desc">{e.notes || "No notes provided."}</div>
      <div style={{ marginBottom: 16 }}>
        {e.documentUrl ? (
          <a className="file-row" href={e.documentUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="paperclip" size={16} /> {e.documentName || "Estimate document"}
          </a>
        ) : (
          <span className="missing-doc"><Icon name="alert" size={14} /> No estimate document attached</span>
        )}
      </div>
      <div className="estimate-actions">
        <button className="btn btn-success" disabled={busy} onClick={onApprove}><Icon name="check" size={16} /> Approve Estimate</button>
        <button className="btn btn-danger" onClick={onReject}><Icon name="x" size={16} /> Reject Estimate</button>
      </div>
    </div>
  );
}
