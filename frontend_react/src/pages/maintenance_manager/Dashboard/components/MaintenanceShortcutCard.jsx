import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* "Monthly Maintenance" card */
export default function MaintenanceShortcutCard() {
  const navigate = useNavigate();
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <h2 className="card-title" style={{ marginBottom: 12 }}>Monthly Maintenance</h2>
      <p className="big-number">Send Cost</p>
      <p className="muted" style={{ marginTop: 4 }}>Create monthly maintenance charges for owners</p>
      <button className="btn btn-success btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(MM_PATHS.maintenance)}>
        <Icon name="wallet" size={16} /> Open Maintenance Page
      </button>
    </section>
  );
}
