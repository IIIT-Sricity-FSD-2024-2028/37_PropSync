import React from "react";
import Icon from "../../shared/Icon";
import { today } from "../../../../services/managerService";

/* "Set Due Date" */
export default function DueDateCard({ value, onChange }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label><Icon name="calendar" size={14} /> Set Due Date</label>
      <input type="date" className="form-control" min={today()} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
