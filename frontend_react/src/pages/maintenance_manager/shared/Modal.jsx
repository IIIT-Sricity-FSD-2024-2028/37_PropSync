import React from "react";
import Icon from "./Icon";

/* Modal with the dark header used across the team UI.
   Click outside or the × closes it. */
export default function Modal({ open, onClose, title, icon, children, width }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={width ? { width } : undefined} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-head">
            <h2>
              {icon && <Icon name={icon} size={20} />}
              {title}
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <Icon name="x" size={22} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
