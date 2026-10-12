import React, { useState } from "react";
import Icon from "../../shared/Icon";

/* "Send Monthly Maintenance Cost" form (month + gross amount).
   onSubmit(month, amount) must return a promise resolving to { text, type } */
export default function MaintenanceChargeForm({ onSubmit }) {
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    const result = await onSubmit(month, Number(amount));
    setSending(false);
    setMessage(result);
    if (result?.type === "success") {
      setMonth("");
      setAmount("");
    }
  };

  const color = { success: "#15803d", error: "#dc2626" }[message?.type] || "#6b7280";

  return (
    <section className="card">
      <p className="detail-label"><span className="detail-label-bar" /> Send Monthly Maintenance Cost</p>
      <form onSubmit={submit}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="field-label"><Icon name="calendar" size={14} /> Month</label>
            <input className="form-control" type="month" required value={month} onChange={(e) => setMonth(e.target.value)}  />
          </div>
          <div style={{ flex: 1.2, minWidth: 220 }}>
            <label className="field-label"><Icon name="wallet" size={14} /> Owner Charge Amount (Gross)</label>
            <input className="form-control" type="number" min="1" placeholder="2000" required value={amount} onChange={(e) => setAmount(e.target.value)}  />
          </div>
          <button className="btn btn-success" type="submit" disabled={sending} style={{ height: 48 }}>
            <Icon name="send" size={16} /> {sending ? "Sending..." : "Send to Owners"}
          </button>
        </div>
        <div className="form-hint">After payment, PropSync retains 5%; your receivable is 95%.</div>
      </form>
      {message?.text && <div style={{ marginTop: 12, fontSize: "0.9rem", fontWeight: 600, color }}>{message.text}</div>}
    </section>
  );
}
