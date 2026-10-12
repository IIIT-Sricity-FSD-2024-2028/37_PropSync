import React, { useState } from "react";
import Modal from "./Modal";

/* Reject complaint / estimate – asks for a reason.
   Render it with a changing `key` so the textarea is empty each time. */
export default function RejectModal({ open, title = "Reject Complaint", targetId, note, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!reason.trim()) return setError("Please enter a rejection reason.");
    onSubmit(reason.trim());
  };

  return (
    <Modal open={open} onClose={onClose} icon="x" title={`${title} ${targetId ?? ""}`}>
      <p className="modal-text">{note || "This reason will be sent to the resident who raised the complaint."}</p>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Rejection Reason</label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Enter reason for rejection..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
        />
        {error && <p className="field-error">{error}</p>}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={submit}>Submit Rejection</button>
      </div>
    </Modal>
  );
}
