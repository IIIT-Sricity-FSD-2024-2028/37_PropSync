import { useCallback, useEffect, useMemo, useState } from "react";
import { FiClock, FiEye, FiPlus, FiTool, FiX } from "react-icons/fi";
import { getRoleSession, roleRequest } from "../../services/roleApi";
import "./AdminPages.css";

const STATUSES = ["all", "pending", "approved", "rejected", "assigned", "estimating_cost", "in_progress", "completed", "billed", "paid", "payment_pending", "closed", "resolved"];
const localDateValue = () => { const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 10); };
export default function AdministratorComplaints() {
  const session = getRoleSession("admin");
  const [items, setItems] = useState([]);
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Plumbing", priority: "medium", ownerId: "" });
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState({ loading: true, error: "" });
  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const [result, userResult] = await Promise.all([roleRequest("admin", session.id, "/complaints"), roleRequest("admin", session.id, "/users?role=owner")]);
      const ownerList = Array.isArray(userResult) ? userResult.filter((user) => user.approvalStatus === "approved") : [];
      setOwners(ownerList);
      setItems(Array.isArray(result) ? result.map((item) => {
        const owner = ownerList.find((user) => user.id === item.ownerId);
        return { ...item, ownerName: owner?.name || `Owner #${item.ownerId}`, propertyUnit: owner?.propertyUnit || item.location };
      }) : []);
      setState({ loading: false, error: "" });
    } catch (error) { setState({ loading: false, error: error.message }); }
  }, [session.id]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => items.filter((item) => {
    const q = search.trim().toLowerCase();
    const text = [item.title, item.description, item.ownerName, item.providerName, item.propertyUnit, item.location, item.category, item.id].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (filter === "all" || String(item.status).toLowerCase() === filter);
  }), [items, search, filter]);
  const viewDetails = async (item) => {
    setSelected(item); setDetailLoading(true);
    try {
      const detail = await roleRequest("admin", session.id, `/complaints/${item.id}`);
      const owner = owners.find((user) => user.id === detail.ownerId);
      setSelected((current) => current?.id === item.id ? { ...current, ...detail, ownerName: owner?.name || `Owner #${detail.ownerId}`, propertyUnit: owner?.propertyUnit || detail.location } : current);
    } catch (error) { setState((current) => ({ ...current, error: error.message })); }
    finally { setDetailLoading(false); }
  };
  const submitComplaint = async (event) => {
    event.preventDefault();
    setSaving(true); setState((current) => ({ ...current, error: "" }));
    try {
      const created = await roleRequest("admin", session.id, "/complaints", { method: "POST", body: JSON.stringify({ ...form, ownerId: Number(form.ownerId) }) });
      const owner = owners.find((user) => user.id === Number(form.ownerId));
      setItems((current) => [{ ...created, ownerName: owner?.name || `Owner #${created.ownerId}`, propertyUnit: owner?.propertyUnit || created.location }, ...current]);
      setAdding(false); setForm({ title: "", description: "", category: "Plumbing", priority: "medium", ownerId: "" });
      setState((current) => ({ ...current, error: "", success: "Complaint submitted and sent to the community manager." }));
    } catch (error) { setState((current) => ({ ...current, error: error.message })); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete complaint "${item.title}"?`)) return;
    try {
      await roleRequest("admin", session.id, `/complaints/${item.id}`, { method: "DELETE" });
      setItems((list) => list.filter((entry) => entry.id !== item.id)); setSelected(null);
    } catch (error) { setState((current) => ({ ...current, error: error.message })); }
  };
  return <main className="role-page admin-role-page admin-complaints">
    <header className="role-head"><div><h1>Complaints</h1><p>Manage maintenance complaints and service requests</p></div><button className="role-button secondary" onClick={load} disabled={state.loading}>Refresh</button></header>
    {state.success && <div className="role-alert success" role="status">{state.success}</div>}
    {state.error && <div className="role-alert" role="alert">{state.error}</div>}
    <div className="admin-complaints-toolbar"><select className="role-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter complaint status">{STATUSES.map((status) => <option key={status} value={status}>{status === "all" ? "All Complaints" : status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())}</option>)}</select><input className="role-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, service provider, type, or property..." aria-label="Search complaints"/><span className="admin-results-count">{filtered.length} {filtered.length === 1 ? "Complaint" : "Complaints"}</span><button className="role-button admin-add-complaint" onClick={() => { setForm((current) => ({ ...current, ownerId: owners[0] ? String(owners[0].id) : "" })); setAdding(true); }}><FiPlus /> Add Complaint</button></div>
    {state.loading && <div className="role-empty">Loading community complaints...</div>}
    {!state.loading && filtered.length === 0 && <div className="role-panel admin-complaint-empty"><h2>No Complaints Found</h2><p>{search ? "Try adjusting your search terms or filters." : "No complaints match the selected filter for your community."}</p></div>}
    <div className="admin-complaint-list">{filtered.map((item) => <article className="admin-complaint-card" key={item.id}>
      <div className="admin-complaint-main"><span className="admin-complaint-icon"><FiTool/></span><div className="admin-complaint-content">
        <div className="admin-complaint-title"><h2>{item.title}</h2><span>#C-{item.id}</span></div><p className="admin-complaint-description">{item.description || "No description supplied."}</p>
        <div className="admin-complaint-info"><div><span>Service Provider</span><strong>{item.providerName || (item.assignedProviderId ? `Provider #${item.assignedProviderId}` : "Not Assigned")}</strong></div><div><span>Provider Type</span><strong>{item.category || "—"}</strong></div><div><span>Property / Location</span><strong>{item.propertyUnit || item.location || item.property || "—"}</strong></div><div><span>Reported By</span><strong>{item.ownerName || `Owner #${item.ownerId}`}</strong></div></div>
        <div className="admin-complaint-meta"><time><FiClock/>{item.submittedAt || item.createdAt ? new Date(item.submittedAt || item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable"}</time><div className="role-actions"><button className="role-button secondary" onClick={() => viewDetails(item)}><FiEye/> View Details</button><button className="role-button danger" onClick={() => remove(item)}>Delete</button></div></div>
      </div></div><div className="admin-complaint-status"><span className={`admin-status-badge ${String(item.status || "").toLowerCase().replaceAll("_", "-")}`}>{String(item.status || "Unknown").replaceAll("_", " ")}</span><span className={`admin-priority-badge ${String(item.priority || "medium").toLowerCase()}`}>{String(item.priority || "medium").toUpperCase()} PRIORITY</span></div>
    </article>)}</div>
    {adding && <div className="role-modal admin-complaint-add-modal" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setAdding(false); }}><section className="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="add-complaint-title"><header className="admin-detail-heading"><div><h2 id="add-complaint-title">Add New Complaint</h2><p>Submit a maintenance request for an owner in your community.</p></div><button className="admin-modal-close" aria-label="Close" onClick={() => setAdding(false)}><FiX/></button></header><form className="admin-add-complaint-form" onSubmit={submitComplaint}><label>Complaint Title <span>*</span><input required maxLength="120" className="role-input" placeholder="Enter complaint title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label><label>Description <span>*</span><textarea required rows="3" maxLength="2000" className="role-input" placeholder="Describe the issue..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label><div className="admin-add-form-row"><label>Service Provider <span>*</span><input className="role-input" value="Assigned by maintenance manager after approval" readOnly/></label><label>Provider Type<select className="role-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["Plumbing","Electrical","HVAC","Carpentry","Painting","Sanitation","Security","Elevator","General","Maintenance"].map((category) => <option key={category}>{category}</option>)}</select></label></div><label>Property <span>*</span><select required className="role-select" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}><option value="">Choose property / resident</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.propertyUnit || "Property not specified"} — {owner.name}</option>)}</select></label><div className="admin-add-form-row"><label>Reported By <span>*</span><input className="role-input" value={owners.find((owner) => owner.id === Number(form.ownerId))?.name || ""} readOnly placeholder="Choose a property above"/></label><label>Reported Date<input type="date" className="role-input" value={localDateValue()} readOnly/></label></div><div className="admin-add-form-row"><label>Status<select className="role-select" value="pending" disabled><option value="pending">Pending</option></select></label><label>Priority<select className="role-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></label></div><label>Estimated Cost (optional)<input className="role-input" value="Added by the provider after assessment" readOnly/></label><p className="admin-add-workflow-note">The complaint starts as Pending and is routed to the maintenance manager assigned to the owner’s block. Provider assignment and estimate are recorded during the review workflow.</p>{state.error && <div className="role-alert" role="alert">{state.error}</div>}<footer><button type="button" className="role-button secondary" disabled={saving} onClick={() => setAdding(false)}>Cancel</button><button className="role-button" disabled={saving || owners.length === 0}>{saving ? "Submitting..." : "Save Complaint"}</button></footer>{owners.length === 0 && <p className="role-alert">No approved owners are available in your community.</p>}</form></section></div>}
    {selected && <div className="role-modal admin-complaint-modal" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="complaint-title"><div className="admin-detail-heading"><h2 id="complaint-title">View Complaint Details</h2><button className="admin-modal-close" aria-label="Close details" onClick={() => setSelected(null)}><FiX/></button></div><div className="admin-detail-body">{detailLoading && <div className="role-empty">Loading complaint details...</div>}<ComplaintDetails complaint={selected}/><div className="admin-detail-footer"><button className="role-button secondary" onClick={() => setSelected(null)}>Close</button></div></div></section></div>}
  </main>;
}

const STEPS = ["Submitted", "Approved", "Provider Assigned", "Estimate Submitted", "Work in Progress", "Completed"];
const LIFECYCLE = ["Complaint Submitted", "Complaint Approved", "Service Provider Assigned", "Estimate Submitted", "Estimate Approved", "Work In Progress", "Work Completed", "Payment Processed"];
const STATUS_PROGRESS = { pending: 10, approved: 25, assigned: 35, estimating_cost: 50, "estimate-approval": 50, in_progress: 65, ongoing: 65, completed: 85, billed: 90, paid: 100, closed: 100, rejected: 0 };
const STATUS_STEP = { pending: 0, rejected: 0, approved: 1, assigned: 2, estimating_cost: 3, "estimate-approval": 3, in_progress: 4, ongoing: 4, completed: 5, billed: 5, paid: 5, closed: 5 };
function ComplaintDetails({ complaint }) {
  const status = String(complaint.status || "pending").toLowerCase();
  const step = STATUS_STEP[status] ?? 1;
  const progress = STATUS_PROGRESS[status] ?? 35;
  const provider = complaint.providerName || (complaint.assignedProviderId ? `Provider #${complaint.assignedProviderId}` : "Not yet assigned");
  const cost = complaint.estimatedCost ?? complaint.estimateAmount;
  const submitted = complaint.submittedAt || complaint.createdAt;
  const date = submitted ? new Date(submitted).toLocaleDateString("en-US") : "—";
  const lifecycleDates = [date, step >= 1 ? "Approved by Maintenance Manager" : "Pending review", step >= 2 ? provider : "Pending assignment", step >= 3 ? (cost ? `Estimate: ₹${cost}` : "Estimate submitted") : "Pending estimate", complaint.estimateApproved ? "Estimate approved" : "Pending estimate review", step >= 4 ? "Service provider on-site" : "Pending work start", step >= 5 ? "Work completed" : "Pending completion", ["paid", "closed"].includes(status) ? "Payment processed" : "Pending final billing"];
  const fields = [["Complaint ID", `C-${complaint.id}`], ["Priority", String(complaint.priority || "medium").toUpperCase()], ["Issue", complaint.title], ["Location", complaint.location || complaint.propertyUnit || complaint.property || "—"], ["Submitted By", complaint.ownerName || `Owner #${complaint.ownerId}`], ["Submitted Date", date], ["Assigned Provider", provider], ["Due Date", complaint.deadline || "Within 7 days"], ["Current Status", String(complaint.status || "Unknown").replaceAll("_", " ")], ["Estimated Cost", cost ? `₹${cost}` : "Not submitted"]];
  return <>
    <div className="admin-complaint-stepper">{STEPS.map((label, index) => <div className={`admin-step ${index < step ? "done" : index === step ? "current" : ""}`} key={label}><span>{index < step ? "✓" : index + 1}</span><b>{label}</b></div>)}</div>
    <div className="admin-detail-grid"><section className="admin-detail-card"><h3>📋 Complaint Information</h3><dl className="admin-detail-info">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value ?? "—")}</dd></div>)}</dl></section><section className="admin-detail-card"><h3>🔄 Complaint Lifecycle</h3><div className="admin-lifecycle">{LIFECYCLE.map((label, index) => <div className="admin-lifecycle-item" key={label}><i className={index <= step + 1 ? "active" : ""}/><div><b className={index <= step + 1 ? "active" : ""}>{label}</b><span>{lifecycleDates[index]}</span></div></div>)}</div></section></div>
    <section className="admin-detail-card"><h3>📊 Work Progress</h3><b className="admin-progress-label">{progress}% Completed</b><div className="admin-progress-track"><span style={{ width: `${progress}%` }}/></div><div className="admin-work-meta"><div><small>📅 Submitted On</small><b>{date}</b></div><div><small>🕐 Due Date</small><b>{complaint.deadline || "Standard TAT (7 Days)"}</b></div><div><small>👤 Service Provider</small><b>{provider}</b></div></div></section>
    <section className="admin-detail-card"><h3>🕐 Work Updates &amp; Timeline</h3><div className="admin-timeline"><div><i/><section><b>Issue Reported &amp; Logged <small>{date}</small></b><p>Resident reported issue: {complaint.title}</p></section></div><div><i/><section><b>Review &amp; Assignment Status <small>System Log</small></b><p>Status: <strong>{String(complaint.status || "Unknown").replaceAll("_", " ")}</strong> · Provider: {provider}</p></section></div><div><i/><section><b>Community Record Synchronized <small>Active Record</small></b><p>Complaint visible to community administrator and assigned maintenance manager.</p></section></div></div></section>
    <section className="admin-detail-card"><h3>📝 Description &amp; Notes</h3><p className="admin-detail-note">{complaint.description || "No additional description provided."}{complaint.rejectionReason && <><br/><strong>Rejection reason: </strong>{complaint.rejectionReason}</>}</p></section>
    <section className="admin-detail-card"><h3>📄 Service Provider Documents</h3>{cost ? <div className="admin-document"><span>📄</span><div><b>Service estimate</b><small>Estimated cost: ₹{cost}{complaint.estimateApproved ? " · Approved" : ""}</small></div></div> : <p className="admin-detail-note">No service estimate has been submitted.</p>}</section>
    <section className="admin-detail-card"><h3>📷 Complaint Issue Photo</h3>{complaint.photo ? <a className="admin-complaint-photo" href={complaint.photo} target="_blank" rel="noreferrer"><img src={complaint.photo} alt="Complaint issue"/></a> : <div className="admin-photo-empty">No issue photo was attached to this complaint.</div>}</section>
  </>;
}