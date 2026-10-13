import React from "react";
import { Link } from "react-router-dom";
import { PriorityBadge } from "../../shared/Badges";
import EmptyRow from "../../shared/EmptyRow";
import Icon from "../../shared/Icon";
import { MM_PATHS } from "../../shared/paths";

/* "New Complaints Needing Approval" card on the dashboard */
export default function PendingComplaintsTable({ complaints, loading, onApprove, onReject }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">New Complaints Needing Approval</h2>
        <Link to={MM_PATHS.complaints} className="btn-link">
          View All <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Issue</th><th>Location</th><th>Priority</th><th>Action</th></tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <EmptyRow colSpan={5} text={loading ? "Loading..." : "No pending complaints"} />
            ) : (
              complaints.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="complaint-link" to={MM_PATHS.complaintDetails(c.id)}>#{c.id}</Link>
                  </td>
                  <td>{c.issue}</td>
                  <td className="td-muted">{c.location}</td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td>
                    <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                      <button className="btn btn-success btn-sm" onClick={() => onApprove(c.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onReject(c.id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
