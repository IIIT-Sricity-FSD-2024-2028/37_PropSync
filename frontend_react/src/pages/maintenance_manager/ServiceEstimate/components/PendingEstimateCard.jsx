import { Link } from "react-router-dom";
import EstimateDocumentLink from "../../../../components/service_provider/EstimateDocumentLink";
import { estimateStatus } from "../../../../services/estimateWorkflow";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* One pending estimate: issue, provider, cost, notes, document, Approve / Reject */
export default function PendingEstimateCard({ estimate: e, issue, provider, busy, onApprove, onUnselect, onReject, onDelete, approveLabel = "Approve Estimate", selected = false, details }) {
  return (
    <div className="estimate-card" style={selected ? { borderColor: "#16A34A" } : undefined}>
      <div className="estimate-header">
        <div style={{ minWidth: 0 }}>
          <div className="estimate-badges">
            <Link to={MM_PATHS.complaintDetails(e.complaintId)} className="badge badge-id">#{e.complaintId}</Link>
            <span className="badge badge-pending">{estimateStatus(e)}</span>
            {e.isEdited && (
              <span
                className="badge"
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #93c5fd",
                  fontWeight: 600,
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                Edited &bull; New
              </span>
            )}
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
      {details && <p className="estimate-provider">{details}</p>}
      <div className="estimate-desc">{e.notes || "No notes provided."}</div>
      <div style={{ marginBottom: 16 }}>
        {e.documentUrl ? (
          <EstimateDocumentLink estimate={e} />
        ) : (
          <span className="missing-doc"><Icon name="alert" size={14} /> No estimate document attached</span>
        )}
      </div>
      <div className="estimate-actions">
        {selected ? (
          <button
            className="btn btn-ghost"
            style={{ border: "1px solid #d1d5db", color: "#374151", background: "#f9fafb" }}
            disabled={busy}
            onClick={onUnselect}
          >
            <Icon name="x" size={16} /> Unselect Provider
          </button>
        ) : (
          onApprove && (
            <button className="btn btn-success" disabled={busy} onClick={onApprove}>
              <Icon name="check" size={16} /> {approveLabel}
            </button>
          )
        )}
        {onReject && <button className="btn btn-danger" disabled={busy} onClick={onReject}><Icon name="x" size={16} /> Reject Estimate</button>}
        {onDelete && <button className="btn btn-danger" style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444" }} disabled={busy} onClick={onDelete}><Icon name="trash" size={16} /> Delete</button>}
      </div>
    </div>
  );
}
