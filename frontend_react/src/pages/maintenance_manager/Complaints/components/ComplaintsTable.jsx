import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../shared/Badges";
import EmptyRow from "../../shared/EmptyRow";
import { MM_PATHS } from "../../shared/paths";
import { today } from "../../../../services/managerService";

const DONE = ["Completed", "Billed", "Paid", "Closed", "Rejected"];
/* deadline cell – red + "Overdue" tag when past due (same as the SP tables) */
function Deadline({ c }) {
  if (!c.deadline) return "—";
  const overdue = c.deadline < today() && !DONE.includes(c.status);
  return overdue ? (
    <span style={{ whiteSpace: "nowrap" }}><span className="overdue-text">{c.deadline}</span><span className="overdue-badge">Overdue</span></span>
  ) : (
    c.deadline
  );
}

/* Column headings per tab (same as heads{} in complaints.html) */
export const HEADS = {
  all: ["ID", "Issue", "Location", "Priority", "Status", "Owner / Provider", "Submitted", "Deadline"],
  pending: ["ID", "Issue", "Location", "Priority", "Submitted", "Action"],
  approved: ["ID", "Issue", "Location", "Priority", "Status", "Submitted", "Deadline", "Action"],
  inprogress: ["ID", "Issue", "Location", "Priority", "Provider", "Submitted", "Deadline", "Details"],
  completed: ["ID", "Issue", "Location", "Priority", "Provider", "Deadline", "Details"],
  payment: ["ID", "Issue", "Location", "Priority", "Provider", "Deadline", "Action"],
  rejected: ["ID", "Issue", "Location", "Priority", "Submitted", "Rejection Reason"],
};

/* Complaints table – rows & columns change with the active tab */
export default function ComplaintsTable({ tab, rows, loading, error, onApprove, onReject }) {
  const navigate = useNavigate();
  const heads = HEADS[tab];
  const stop = (e) => e.stopPropagation();
  const open = (id) => navigate(MM_PATHS.complaintDetails(id));

  const renderRow = (c) => {
    const link = <Link className="complaint-link" to={MM_PATHS.complaintDetails(c.id)} onClick={stop}>#{c.id}</Link>;
    const pb = <PriorityBadge priority={c.priority} />;
    const loc = <td className="td-muted">{c.location}</td>;
    const detailsLink = (text) => <Link className="complaint-link" to={MM_PATHS.complaintDetails(c.id)}>{text}</Link>;

    switch (tab) {
      case "pending":
        return (
          <tr key={c.id}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td>{c.submitted}</td>
            <td>
              <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                <button className="btn btn-success btn-sm" onClick={() => onApprove(c.id)}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => onReject(c.id)}>Reject</button>
              </div>
            </td>
          </tr>
        );
      case "approved":
        return (
          <tr key={c.id} className="clickable" onClick={() => open(c.id)}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td><StatusBadge status={c.status} subStatus={c.subStatus} /></td>
            <td>{c.submitted}</td><td><Deadline c={c} /></td>
            <td>
              <Link className="btn btn-primary btn-sm" to={MM_PATHS.assignProvider(c.id)} onClick={stop}>
                View Queue ({c.interestedProviders.length})
              </Link>
            </td>
          </tr>
        );
      case "inprogress":
        return (
          <tr key={c.id}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td>{c.provider || "—"}</td><td>{c.submitted}</td>
            <td><Deadline c={c} /></td><td>{detailsLink("Monitor")}</td>
          </tr>
        );
      case "completed":
        return (
          <tr key={c.id}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td>{c.provider || "—"}</td><td><Deadline c={c} /></td><td>{detailsLink("Details")}</td>
          </tr>
        );
      case "payment":
        return (
          <tr key={c.id}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td>{c.provider || "—"}</td><td><Deadline c={c} /></td>
            <td><button className="btn btn-success btn-sm" onClick={() => navigate(MM_PATHS.paymentHistory)}>Pay Bill</button></td>
          </tr>
        );
      case "rejected":
        return (
          <tr key={c.id}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td>{c.submitted}</td>
            <td style={{ color: "#DC2626", fontSize: "0.85rem" }}>{c.rejectionReason || "—"}</td>
          </tr>
        );
      default:
        return (
          <tr key={c.id} className="clickable" onClick={() => open(c.id)}>
            <td>{link}</td><td>{c.issue}</td>{loc}<td>{pb}</td><td><StatusBadge status={c.status} subStatus={c.subStatus} /></td>
            <td>{c.submittedBy || c.provider || "—"}</td><td>{c.submitted}</td><td><Deadline c={c} /></td>
          </tr>
        );
    }
  };

  return (
    <div className="tab-body">
      <table className="data-table">
        <thead><tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {error ? <EmptyRow colSpan={heads.length} text={error} color="#DC2626" />
            : loading ? <EmptyRow colSpan={heads.length} text="Loading..." />
            : rows.length === 0 ? <EmptyRow colSpan={heads.length} text="No complaints found" />
            : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
