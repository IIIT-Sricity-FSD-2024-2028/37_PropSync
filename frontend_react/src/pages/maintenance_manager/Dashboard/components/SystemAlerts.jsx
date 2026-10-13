import React, { useState } from "react";
import Icon from "../../shared/Icon";

/* "System Alerts" box with Dismiss / Clear all.
   alerts = [{ id, content }] – hidden once all are dismissed */
export default function SystemAlerts({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="alert-box">
      <Icon name="alert" size={18} className="alert-icon" />
      <div style={{ flex: 1 }}>
        <h3>System Alerts</h3>
        <ul>
          {visible.map((a) => (
            <li key={a.id}>
              <span>{a.content}</span>
              <button className="alert-read-btn" onClick={() => setDismissed((d) => [...d, a.id])}>Dismiss</button>
            </li>
          ))}
        </ul>
      </div>
      <button className="alert-clear-all" onClick={() => setDismissed(alerts.map((a) => a.id))}>Clear all</button>
    </div>
  );
}
