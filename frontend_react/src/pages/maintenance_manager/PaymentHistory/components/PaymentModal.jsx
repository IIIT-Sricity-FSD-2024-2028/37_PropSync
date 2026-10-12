import React from "react";
import Modal from "../../shared/Modal";
import Icon from "../../shared/Icon";
import { money } from "../../../../services/managerService";

/* "Approve Payment" confirmation */
export default function PaymentModal({ bill, issue, provider, busy, onCancel, onConfirm }) {
  return (
    <Modal open={!!bill} onClose={onCancel} icon="card" title="Approve Payment">
      {bill && (
        <>
          <p className="modal-text">You are about to approve and process the payment for:</p>
          <div className="modal-row"><span className="label">Complaint ID</span><span className="value green">#{bill.complaintId}</span></div>
          <div className="modal-row"><span className="label">Bill No</span><span className="value">BILL-{bill.id}</span></div>
          <div className="modal-row"><span className="label">Issue</span><span className="value">{issue}</span></div>
          <div className="modal-row"><span className="label">Provider</span><span className="value">{provider}</span></div>
          <div className="modal-row"><span className="label">Final Amount</span><span className="value green">{money(bill.totalAmount || bill.amount)}</span></div>
          <div className="modal-note">
            <Icon name="alert" size={16} />
            <span>This will process the payment and mark the bill as paid. It cannot be undone.</span>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-success" disabled={busy} onClick={onConfirm}>{busy ? "Processing..." : "Confirm Payment"}</button>
          </div>
        </>
      )}
    </Modal>
  );
}
