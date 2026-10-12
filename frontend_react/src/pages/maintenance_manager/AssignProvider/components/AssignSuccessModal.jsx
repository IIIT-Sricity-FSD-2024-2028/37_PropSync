import React from "react";
import Modal from "../../shared/Modal";

/* "Provider Assigned!" modal */
export default function AssignSuccessModal({ open, message, onApprovedList, onAllComplaints }) {
  return (
    <Modal open={open} onClose={onApprovedList} icon="checkCircle" title="Provider Assigned">
      <div className="modal-success">
        <p className="main">{message}</p>
        <p className="sub">Notification sent to the provider and the resident.</p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onApprovedList}>Approved List</button>
        <button className="btn btn-success" onClick={onAllComplaints}>All Complaints</button>
      </div>
    </Modal>
  );
}
