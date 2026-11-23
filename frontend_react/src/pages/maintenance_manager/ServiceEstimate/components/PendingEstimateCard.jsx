import { Link } from "react-router-dom";
import EstimateDocumentLink from "../../../../components/service_provider/EstimateDocumentLink";
import { estimateStatus } from "../../../../services/estimateWorkflow";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* One pending estimate: issue, provider, cost, notes, document, Approve / Reject */
export default function PendingEstimateCard({ estimate: e, issue, provider, busy, onApprove, onReject, approveLabel = "Approve Estimate", selected = false, details }) {
  return (
    <div className="estimate-card" style={selected ? { borderColor: "#16A34A" } : undefined}>
      <div className="estimate-header">
        <div style={{ minWidth: 0 }}>
          <div className="estimate-badges">
            <Link to={MM_PATHS.complaintDetails(e.complaintId)} className="badge badge-id">#{e.complaintId}</Link>
            <span className="badge badge-pending">{estimateStatus(e)}</span>
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
        {onApprove && <button className="btn btn-success" disabled={busy} onClick={onApprove}><Icon name="check" size={16} /> {approveLabel}</button>}
        {onReject && <button className="btn btn-danger" disabled={busy} onClick={onReject}><Icon name="x" size={16} /> Reject Estimate</button>}
      </div>
    </div>
  );
}
