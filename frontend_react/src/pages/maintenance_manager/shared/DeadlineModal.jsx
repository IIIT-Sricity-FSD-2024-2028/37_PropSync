import React, { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { today } from "../../../services/managerService";

/* Approve complaint → choose a deadline
   (the HTML page used prompt("YYYY-MM-DD"); same step with a date picker) */
export default function DeadlineModal({ open, targetId, onClose, onSubmit }) {
  const [deadline, setDeadline] = useState(today());
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onSubmit(deadline);
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={onClose} icon="checkCircle" title={`Approve Complaint ${targetId ?? ""}`}>
      <p className="modal-text">Set a deadline for this complaint before approving it.</p>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label><Icon name="calendar" size={14} /> Deadline</label>
        <input type="date" className="form-control" min={today()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-success" disabled={!deadline || busy} onClick={submit}>
          {busy ? "Approving..." : "Approve"}
        </button>
      </div>
    </Modal>
  );
}
