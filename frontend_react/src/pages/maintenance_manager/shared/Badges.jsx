import React from "react";

/* priorityBadge() / statusBadge() from maintenance_manager.js,
   coloured like the Service Provider badges */
export function PriorityBadge({ priority }) {
  const cls = { High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return <span className={`badge ${cls[priority] || "badge-medium"}`}>{priority}</span>;
}

const STATUS_CLASS = {
  Pending: "badge-pending",
  Approved: "badge-approved",
  Assigned: "badge-approved",
  "Estimating Cost": "badge-estimate",
  "In Progress": "badge-inprogress",
  Completed: "badge-completed",
  Billed: "badge-payment",
  Paid: "badge-completed",
  Closed: "badge-gray",
  "Payment Pending": "badge-payment",
  Rejected: "badge-rejected",
};

export function StatusBadge({ status, subStatus }) {
  const label = status === "Approved" && subStatus ? subStatus : status;
  return <span className={`badge ${STATUS_CLASS[status] || "badge-gray"}`}>{label}</span>;
}
