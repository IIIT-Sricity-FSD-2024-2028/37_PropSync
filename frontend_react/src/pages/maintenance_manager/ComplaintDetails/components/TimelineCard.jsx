import React from "react";
import Icon from "../../shared/Icon";

/* Builds the timeline entries for a complaint status (timelines{} in the HTML) */
function buildTimeline(c, by) {
  const s = c.submittedAt || "";
  const d = c.deadline || s;
  const submitted = { dot: "file", title: "Complaint submitted", by: "Owner", time: `${s} 10:00 AM` };
  const map = {
    pending: [{ ...submitted, title: "Complaint submitted and awaiting review" }],
    approved: [{ dot: "checkCircle", title: "Complaint approved by manager", by: "Maintenance Manager", time: `${s} 02:00 PM` }, submitted],
    assigned: [
      { dot: "user", title: "Service provider assigned", by: "Maintenance Manager", time: `${s} 03:00 PM` },
      { dot: "checkCircle", title: "Complaint approved", by: "Maintenance Manager", time: `${s} 11:00 AM` },
      submitted,
    ],
    estimating_cost: [
      { dot: "clipboard", title: "Service estimate submitted – awaiting approval", by, time: `${s} 04:00 PM` },
      { dot: "user", title: "Service provider assigned", by: "Maintenance Manager", time: `${s} 03:00 PM` },
      submitted,
    ],
    in_progress: [
      { dot: "wrench", title: "Estimate approved – work in progress", by, time: `${d} 09:00 AM` },
      { dot: "clipboard", title: "Service estimate submitted and approved", by: "Maintenance Manager", time: `${s} 04:00 PM` },
      submitted,
    ],
    completed: [
      { dot: "checkCircle", title: "Work completed and verified", by, time: `${d} 05:00 PM` },
      { dot: "wrench", title: "Work in progress", by, time: `${d} 09:00 AM` },
      submitted,
    ],
    rejected: [{ dot: "x", title: "Complaint rejected by manager", by: "Maintenance Manager", time: `${s} 11:00 AM` }, submitted],
  };
  if (["billed", "paid", "closed"].includes(c.status)) {
    const billed = { dot: "wallet", title: "Service bill submitted – awaiting payment", by, time: `${d} 06:00 PM` };
    const paid = { dot: "checkCircle", title: "Payment processed and complaint closed", by: "Maintenance Manager", time: `${d} 07:00 PM` };
    return [...(c.status === "billed" ? [billed] : [paid, billed]), ...map.completed];
  }
  return map[c.status] || map.pending;
}

/* "Work Updates & Timeline" */
export default function TimelineCard({ complaint, providerName }) {
  return (
    <section className="card">
      <h2 className="card-title" style={{ marginBottom: 20 }}>Work Updates &amp; Timeline</h2>
      {buildTimeline(complaint, providerName || "Provider").map((t, i) => (
        <div key={i} className="timeline-item">
          <div className="timeline-dot"><Icon name={t.dot} size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="timeline-title">{t.title}</div>
            <div className="timeline-sub">Updated by: {t.by}</div>
          </div>
          <div className="timeline-time">{t.time}</div>
        </div>
      ))}
    </section>
  );
}
