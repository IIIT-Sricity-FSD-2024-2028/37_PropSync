import React from "react";
import Icon from "../../shared/Icon";

/* "Notes for Provider (Optional)" */
export default function ProviderNotesCard({ value, onChange }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label><Icon name="file" size={14} /> Notes for Provider (Optional)</label>
      <textarea className="form-control" rows={3} placeholder="Special instructions or notes for the assigned provider..." value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
