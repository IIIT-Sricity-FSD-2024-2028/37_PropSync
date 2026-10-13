import React from "react";
import Modal from "./Modal";

/* Yes / No confirmation (replaces window.confirm) */
export default function ConfirmModal({ open, icon = "alert", title, message, confirmLabel = "Confirm", danger, busy, onCancel, onConfirm, children }) {
  return (
    <Modal open={open} onClose={onCancel} icon={icon} title={title}>
      {message && <p className="modal-text">{message}</p>}
      {children}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-success"}`} disabled={busy} onClick={onConfirm}>
          {busy ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
