import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiFilter, FiTool } from "react-icons/fi";
import { getRoleSession, roleRequest } from "../../services/roleApi";
import "./SuperUserPages.css";

const STATUSES = ["all", "pending", "approved", "assigned", "estimating_cost", "estimate_approval", "ongoing", "in_progress", "completed", "paid", "closed", "rejected"];
const LIFECYCLE = ["Submitted", "Approved", "Provider Assigned", "Estimate Submitted", "Work in Progress", "Completed"];
const FULL_LIFECYCLE = ["Complaint Submitted", "Complaint Approved", "Service Provider Assigned", "Estimate Submitted", "Estimate Approved", "Work In Progress", "Work Completed", "Payment Processed"];
function currentStep(status = "") {
  const value = String(status || "").toLowerCase().replaceAll("-", "_");
  if (["completed", "billed", "paid", "closed", "resolved"].includes(value)) return 5;
  if (["ongoing", "in_progress"].includes(value)) return 4;
  if (["estimate_approval", "estimating_cost", "billed"].includes(value)) return 3;
  if (value === "assigned") return 2;
  if (value === "approved") return 1;
  return 0;
}
function completionPercent(status = "") {
  const value = String(status || "").toLowerCase().replaceAll("-", "_");
  return ({ pending: 10, approved: 25, assigned: 35, estimating_cost: 50, estimate_approval: 50, in_progress: 65, ongoing: 65, completed: 85, billed: 90, paid: 100, closed: 100, resolved: 100, rejected: 0 })[value] ?? 35;
}
function formattedDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}
function label(value) { return String(value || "—").replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default function SuperUserComplaints() {
  const session = getRoleSession("super_user");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [detailsState, setDetailsState] = useState({ loading: false, error: "" });
  const [state, setState] = useState({ loading: true, error: "" });
  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const list = await roleRequest("super_user", session.id, "/complaints");
      setItems(Array.isArray(list) ? list : []);
      setState({ loading: false, error: "" });
    } catch (error) { setState({ loading: false, error: error.message }); }
  }, [session.id]);
  const openDetails = async (complaint) => {
    setSelected(complaint);
    setDetailsState({ loading: true, error: "" });
    try {
      const detail = await roleRequest("super_user", session.id, `/complaints/${complaint.id}`);
      setSelected(detail || complaint);
      setDetailsState({ loading: false, error: "" });
    } catch (error) {
      setDetailsState({ loading: false, error: error.message });
    }
  };
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => items.filter((complaint) => {
    const query = search.trim().toLowerCase();
    return (!query || [complaint.id, complaint.title, complaint.description, complaint.location, complaint.ownerId, complaint.category, complaint.assignedProviderId].join(" ").toLowerCase().includes(query)) && (filter === "all" || String(complaint.status || "").toLowerCase() === filter);
  }), [items, search, filter]);

  return <main className="role-page superuser-role-page superuser-complaints">
    <header className="role-head"><div><h1>Complaints</h1><p>Review maintenance complaints and service requests across all properties</p></div><button className="role-button secondary" onClick={load} disabled={state.loading}>Refresh</button></header>
    {state.error && <div className="role-alert" role="alert">{state.error}</div>}
    <div className="role-toolbar su-complaints-toolbar"><label className="su-filter-control"><FiFilter /><select className="role-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter complaints">{STATUSES.map((status) => <option value={status} key={status}>{status === "all" ? "All Complaints" : label(status)}</option>)}</select></label><input className="role-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, service provider, type, or property…" aria-label="Search complaints"/><span className="role-muted">{filtered.length} Complaints</span></div>
    {state.loading ? <div className="role-empty">Loading complaints…</div> : !filtered.length ? <div className="role-panel role-empty">No complaints match these filters.</div> : <div className="su-complaint-list">
      {filtered.map((complaint) => <article className="su-complaint-card" key={complaint.id}>
        <div className="su-complaint-icon"><FiTool /></div><div className="su-complaint-main">
          <div className="su-complaint-title"><h2>{complaint.title || "Maintenance complaint"}</h2><span>#{complaint.id}</span></div>
          <p className="su-complaint-description">{complaint.description || "No description provided."}</p>
          <div className="su-complaint-meta">
            <div><span>Service Provider</span><strong>{complaint.assignedProviderName || complaint.assignedProviderId || "Not Assigned"}</strong></div>
            <div><span>Provider Type</span><strong>{label(complaint.category)}</strong></div>
            <div><span>Property / Location</span><strong>{complaint.location || "—"}</strong></div>
            <div><span>Reported By</span><strong>{complaint.ownerName || complaint.ownerId || "—"}</strong></div>
          </div>
          <div className="su-complaint-date">◷ <time>{(complaint.submittedAt || complaint.createdAt) ? new Date(complaint.submittedAt || complaint.createdAt).toLocaleDateString() : "—"}</time></div>
        </div>
        <div className="su-complaint-actions"><span className={`su-status-pill ${String(complaint.status || "pending").toLowerCase().replaceAll("_", "-")}`}>{label(complaint.status)}</span><span className={`su-priority-pill ${String(complaint.priority || "medium").toLowerCase()}`}>{label(complaint.priority || "medium")} Priority</span><button type="button" className="role-button secondary" onClick={() => openDetails(complaint)}><FiEye /> View Details</button></div>
      </article>)}
    </div>}
    {selected && <div className="role-modal su-complaint-overlay" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="role-modal-card su-complaint-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="su-complaint-modal-title">
      <div className="su-detail-modal-header"><h2 id="su-complaint-modal-title">View Complaint Details</h2><button type="button" className="su-modal-close" onClick={() => setSelected(null)} aria-label="Close details">×</button></div>
      {detailsState.loading && <div className="role-empty su-detail-loading">Loading the latest complaint details…</div>}{detailsState.error && <div className="role-alert" role="alert">Could not refresh complaint details: {detailsState.error}. Showing the available complaint record.</div>}
      <div className="su-detail-modal-body">
        <div className="su-lifecycle">{LIFECYCLE.map((step, index) => <div className={`su-lifecycle-step ${index < currentStep(selected.status) ? "done" : ""} ${index === currentStep(selected.status) ? "current" : ""}`} key={step}><span>{index < currentStep(selected.status) ? "✓" : index + 1}</span><strong>{step}</strong></div>)}</div>
        <div className="su-complaint-detail-grid"><section className="su-detail-card"><h3>📋 Complaint Information</h3><dl>{[["Complaint ID", selected.id], ["Priority", label(selected.priority)], ["Issue", selected.title], ["Location", selected.location], ["Submitted By", selected.ownerName || `Owner #${selected.ownerId ?? "—"}`], ["Submitted Date", formattedDate(selected.submittedAt || selected.createdAt)], ["Assigned Provider", selected.assignedProviderName || (selected.assignedProviderId ? `Provider #${selected.assignedProviderId}` : "Not Assigned")], ["Due Date", selected.deadline || "Not set"], ["Current Status", label(selected.status)], ["Estimated Cost", selected.estimatedCost ? `₹${selected.estimatedCost}` : selected.estimateSubmitted ? "Estimate submitted" : "Not submitted"]].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? "—")}</dd></div>)}</dl></section>
          <section className="su-detail-card"><h3>🔄 Complaint Lifecycle</h3>{FULL_LIFECYCLE.map((step, index) => {const stepIndex=currentStep(selected.status);const details=[formattedDate(selected.submittedAt),stepIndex>=1?"Approved": "Pending review",stepIndex>=2?(selected.assignedProviderId?`Provider #${selected.assignedProviderId}`:"Assigned"):"Pending assignment",selected.estimateSubmitted?"Estimate submitted":"Pending estimate",selected.estimateApproved?"Estimate approved":"Pending estimate review",stepIndex>=4?"Service provider on-site":"Pending work start",stepIndex>=5?"Work completed":"Pending completion",["paid","closed"].includes(String(selected.status||"").toLowerCase())?"Payment processed":"Pending final billing"];const done=index<=stepIndex+1;return <div className={`su-lifecycle-row ${done?"active":""}`} key={step}><i /><div><strong>{step}</strong><span>{details[index]}</span></div></div>;})}</section></div>
        <section className="su-detail-card su-work-progress"><h3>📊 Work Progress</h3><strong className="su-progress-label">{completionPercent(selected.status)}% Completed</strong><div className="su-progress-track"><span style={{width:`${completionPercent(selected.status)}%`}} /></div><div className="su-work-meta"><div><span>📅 Submitted On</span><strong>{formattedDate(selected.submittedAt)}</strong></div><div><span>◷ Due Date</span><strong>{selected.deadline || "Not set"}</strong></div><div><span>👤 Service Provider</span><strong>{selected.assignedProviderName || (selected.assignedProviderId ? `Provider #${selected.assignedProviderId}` : "Unassigned")}</strong></div></div></section>
        <section className="su-detail-card"><h3>◷ Work Updates &amp; Timeline</h3><div className="su-timeline"><article><i /><div><strong>Issue Reported &amp; Logged <time>{formattedDate(selected.submittedAt)}</time></strong><p>Resident reported issue: {selected.title || "Maintenance complaint"}</p></div></article><article><i className="green" /><div><strong>Review &amp; Assignment Status <time>{formattedDate(selected.updatedAt)}</time></strong><p>Status: <b>{label(selected.status)}</b> · Provider: {selected.assignedProviderName || (selected.assignedProviderId ? `Provider #${selected.assignedProviderId}` : "Not Assigned")}</p></div></article><article><i className="purple" /><div><strong>PropSync System Record <time>Current</time></strong><p>This complaint is stored in the platform record and visible to authorized maintenance staff.</p></div></article></div></section>
        <section className="su-detail-card"><h3>📝 Description &amp; Notes</h3><p className="su-description-box">{selected.description || "No additional description provided."}</p></section>
        <section className="su-detail-card"><h3>📄 Service Provider Documents</h3>{selected.estimateSubmitted ? <div className="su-document-row"><span>📄</span><div><strong>Service estimate submitted</strong><small>{selected.estimatedCost ? `Estimate amount: ₹${selected.estimatedCost}` : "Estimate amount is not included in this complaint record."}</small></div></div> : <div className="su-document-empty">No service provider documents are attached to this complaint.</div>}</section>
        <section className="su-detail-card"><h3>📷 Complaint Issue Photo</h3>{selected.photo ? <img className="su-complaint-photo" src={selected.photo.startsWith("http")?selected.photo:`${import.meta.env.VITE_API_URL||"http://localhost:3000"}/${selected.photo.replace(/^\//,"")}`} alt={`Issue reported for ${selected.title||"complaint"}`}/> : <div className="su-photo-empty">No issue photo is attached to this complaint.</div>}</section>
        <div className="su-detail-footer"><button type="button" className="role-button secondary" onClick={() => setSelected(null)}>Close</button></div>
      </div>
    </section></div>}
  </main>;
}