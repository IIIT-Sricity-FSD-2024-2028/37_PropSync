import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";
import { money } from "../../../../services/managerService";

/* One pending service bill: amounts (bill / penalty / final), attachments, Mark as Paid */
export default function BillCard({ bill: b, issue, provider, onPay }) {
  return (
    <div className="bill-card">
      <div className="bill-card-header">
        <div className="bill-info">
          <div className="estimate-badges">
            <Link to={MM_PATHS.complaintDetails(b.complaintId)} className="badge badge-id">#{b.complaintId}</Link>
            <span className="badge badge-dark">BILL-{b.id}</span>
            <span className="badge badge-payment">Pending Payment</span>
          </div>
          <h3>{issue}</h3>
          <p>Provider: {provider} · Submitted {b.generatedAt || "—"}</p>
        </div>
      </div>
      <div className="bill-amounts">
        <div className="bill-amount-box"><p className="amount-label">Submitted Bill</p><p className="amount-value">{money(b.amount)}</p></div>
        <div className="bill-amount-box"><p className="amount-label">Penalty</p><p className="amount-value" style={{ color: "#DC2626" }}>{money(b.penalty || 0)}</p></div>
        <div className="bill-amount-box bill-final"><p className="amount-label">Final Amount</p><p className="amount-value" style={{ color: "#42a443" }}>{money(b.totalAmount || b.amount)}</p></div>
      </div>
      <div className="estimate-desc">{b.description || "No bill description provided."}</div>
      <div style={{ marginBottom: 16 }}>
        {(b.attachmentUrls || []).length ? (
          b.attachmentUrls.map((url, i) => (
            <a key={url} className="file-row" href={url} target="_blank" rel="noopener noreferrer">
              <Icon name="paperclip" size={16} /> {(b.attachmentNames || [])[i] || `File ${i + 1}`}
            </a>
          ))
        ) : (
          <span className="missing-doc"><Icon name="alert" size={14} /> No bill attachment uploaded</span>
        )}
      </div>
      <button className="btn btn-success btn-full" onClick={onPay}><Icon name="card" size={16} /> Mark as Paid</button>
    </div>
  );
}
