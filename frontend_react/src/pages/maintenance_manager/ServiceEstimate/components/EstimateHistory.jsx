import React, { useState } from "react";
import { Link } from "react-router-dom";
import Tabs from "../../shared/Tabs";
import EmptyRow from "../../shared/EmptyRow";
import { MM_PATHS } from "../../shared/paths";

const TABS = [{ id: "all", label: "All History" }, { id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" }];

/* "Estimate History" – tabs + table of reviewed estimates.
   history = estimates with approved === true/false (newest first) */
export default function EstimateHistory({ history, issueOf, providerOf }) {
  const [tab, setTab] = useState("all");
  const rows = history.filter((e) => tab === "all" || (tab === "approved") === e.approved);

  return (
    <div style={{ marginTop: 32 }}>
      <h2 className="section-title">Estimate History</h2>
      <div className="tabs-container">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="tab-body">
          <table className="data-table">
            <thead>
              <tr><th>Complaint ID</th><th>Issue</th><th>Provider</th><th>Estimated Cost</th><th>Submitted</th><th>Decision</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <EmptyRow colSpan={8} text="No history found" /> : rows.map((e) => (
                <tr key={e.id}>
                  <td><Link className="complaint-link" to={MM_PATHS.complaintDetails(e.complaintId)}>#{e.complaintId}</Link></td>
                  <td>{issueOf(e)}</td>
                  <td>{providerOf(e)}</td>
                  <td style={{ fontWeight: 700, color: "#42a443" }}>₹{Number(e.estimatedCost).toLocaleString("en-IN")}</td>
                  <td>{e.submittedAt || "—"}</td>
                  <td>{e.approved ? <span className="badge badge-approved">Approved</span> : <span className="badge badge-rejected">Rejected</span>}</td>
                  <td>{e.reviewedAt || "—"}</td>
                  <td><Link className="btn-link" to={MM_PATHS.complaintDetails(e.complaintId)}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
