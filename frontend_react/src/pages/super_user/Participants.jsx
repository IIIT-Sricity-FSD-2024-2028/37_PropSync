import { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity, FiBriefcase, FiEdit2, FiEye, FiGlobe, FiHome, FiMail, FiPlus, FiTrash2, FiUser, FiX } from "react-icons/fi";
import { formatRole, getRoleSession, roleRequest } from "../../services/roleApi";
import "./SuperUserPages.css";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", role: "owner", communityName: "", propertyUnit: "", block: "", category: "" };

export default function SuperUserParticipants() {
  const session = getRoleSession("super_user");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("name");
  const [dir, setDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", communityName: "", propertyUnit: "", block: "" });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const result = await roleRequest("super_user", session.id, "/users");
      const actualUsers = Array.isArray(result) ? result.map((user, index) => ({
        ...user,
        participantCode: `P${String(index + 1).padStart(3, "0")}`,
      })) : [];
      setUsers(actualUsers);
      setState((previous) => ({ ...previous, loading: false }));
    } catch (error) {
      setState((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  }, [session.id]);

  useEffect(() => { load(); }, [load]);

  const communities = useMemo(() => [...new Set(users.map((user) => user.communityName).filter(Boolean))].sort(), [users]);
  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [user.participantCode, user.id, user.name, user.email, user.communityName].some((value) => String(value ?? "").toLowerCase().includes(query));
    return matchesSearch && (role === "all" || user.role === role);
  }).sort((a, b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), undefined, { numeric: true, sensitivity: "base" }) * (dir === "asc" ? 1 : -1)), [users, search, role, sort, dir]);

  const changeSort = (field) => {
    if (sort === field) setDir((value) => value === "asc" ? "desc" : "asc");
    else { setSort(field); setDir("asc"); }
  };
  const closeCreate = () => { setCreating(false); setForm(EMPTY_FORM); };
  const createParticipant = async (event) => {
    event.preventDefault();
    setState((previous) => ({ ...previous, saving: true, error: "", success: "" }));
    const payload = { ...form };
    if (payload.role === "service_provider") payload.communityName = undefined;
    if (payload.role !== "owner") payload.propertyUnit = undefined;
    if (payload.role !== "maintenance_manager") payload.block = undefined;
    if (payload.role !== "service_provider") payload.category = undefined;
    try {
      await roleRequest("super_user", session.id, "/users", { method: "POST", body: JSON.stringify(payload) });
      closeCreate();
      setState((previous) => ({ ...previous, saving: false, success: "Signup request created. It will appear after approval." }));
      await load();
    } catch (error) {
      setState((previous) => ({ ...previous, saving: false, error: error.message }));
    }
  };

  const openEdit = (user) => {
    setSelected(user);
    setEditing(true);
    setEditForm({ name: user.name || "", phone: user.phone || "", communityName: user.communityName || "", propertyUnit: user.propertyUnit || "", block: user.block || "" });
    setState((previous) => ({ ...previous, error: "", success: "" }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setState((previous) => ({ ...previous, saving: true, error: "", success: "" }));
    try {
      await roleRequest("super_user", session.id, `/users/${selected.id}`, { method: "PATCH", body: JSON.stringify(editForm) });
      setEditing(false);
      setSelected(null);
      setState((previous) => ({ ...previous, saving: false, success: "Participant updated successfully." }));
      await load();
    } catch (error) {
      setState((previous) => ({ ...previous, saving: false, error: error.message }));
    }
  };

  const deleteParticipant = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This removes the participant account.`)) return;
    setState((previous) => ({ ...previous, saving: true, error: "", success: "" }));
    try {
      await roleRequest("super_user", session.id, `/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSelected(null);
      setState((previous) => ({ ...previous, saving: false, success: "Participant deleted successfully." }));
    } catch (error) {
      setState((previous) => ({ ...previous, saving: false, error: error.message }));
    }
  };

  return <main className="role-page superuser-role-page superuser-participants">
    <header className="role-head"><div><h1>Manage Participants</h1><p>Control panel for managing system users across all roles</p></div></header>
    {state.error && <div className="role-alert" role="alert">{state.error}</div>}
    {state.success && <div className="role-alert success" role="status">{state.success}</div>}
    <section className="role-toolbar su-participant-toolbar" aria-label="Participant search and filters">
      <input className="role-input" placeholder="Search by name, ID, or email..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search participants" />
      <select className="role-select" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All Roles</option>{["owner", "maintenance_manager", "service_provider", "admin"].map((value) => <option key={value} value={value}>{formatRole(value)}</option>)}</select>
      <select className="role-select" value={`${sort}:${dir}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSort(field); setDir(direction); }} aria-label="Sort participants"><option value="name:asc">Sort By: Name (Aâ€“Z)</option><option value="id:asc">Sort By: ID (Aâ€“Z)</option><option value="email:asc">Sort By: Email (Aâ€“Z)</option><option value="name:desc">Name (Zâ€“A)</option></select>
      <button type="button" className="role-button su-add-participant" onClick={() => { setForm({ ...EMPTY_FORM, communityName: communities[0] || "" }); setCreating(true); setState((previous) => ({ ...previous, error: "", success: "" })); }}><FiPlus /> Add Participant</button>
    </section>
    <div className="role-table-wrap su-participants-table"><table className="role-table"><thead><tr><th><button type="button" onClick={() => changeSort("participantCode")}>Participant ID â†•</button></th><th><button type="button" onClick={() => changeSort("name")}>Name â†•</button></th><th><button type="button" onClick={() => changeSort("email")}>Email â†•</button></th><th>Role</th><th>Access Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}>
      <td className="su-participant-code">{user.participantCode}</td>
      <td className="su-participant-name"><strong>{user.name}</strong>{user.communityName && <small>{user.communityName}</small>}</td>
      <td className="su-participant-email">{user.email}</td>
      <td><span className={`su-role-pill ${user.role}`}>{formatRole(user.role)}</span></td>
      <td><span className={`su-access-pill ${user.approvalStatus || "approved"}`}>{user.approvalStatus === "approved" ? "Active" : formatRole(user.approvalStatus || "approved")}</span></td>
      <td><div className="su-participant-actions"><button type="button" className="edit" title="Edit participant" aria-label="Edit participant" onClick={() => openEdit(user)}><FiEdit2 /></button><button type="button" className="view" title="View participant" aria-label="View participant" onClick={() => { setEditing(false); setSelected(user); }}><FiEye /></button><button type="button" className="delete" title="Delete participant" aria-label="Delete participant" onClick={() => deleteParticipant(user)}><FiTrash2 /></button></div></td>
    </tr>)}</tbody></table>
      {state.loading && <div className="role-empty">Loading platform participants...</div>}
      {!state.loading && filtered.length === 0 && <div className="role-empty">No participants match these filters.</div>}
    </div>

    {creating && <div className="role-modal" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}><section className="role-modal-card su-add-modal" role="dialog" aria-modal="true" aria-labelledby="add-participant-title"><header className="role-head"><div><h2 id="add-participant-title">Add New Participant</h2><p>Fill in the details to create a participant signup request.</p></div><button type="button" className="role-button secondary" onClick={closeCreate}>Close</button></header>
      <form className="role-stack" onSubmit={createParticipant}><div className="role-form-grid">
        <label className="role-field">Full name<input className="role-input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="role-field">Email address<input className="role-input" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="role-field">Temporary password<input className="role-input" required type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <label className="role-field">Phone<input className="role-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label className="role-field">Role<select className="role-select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="owner">Property Owner</option><option value="maintenance_manager">Maintenance Manager</option><option value="service_provider">Service Provider</option><option value="admin">Administrator</option></select></label>
        {form.role !== "service_provider" && <label className="role-field">Community<select required className="role-select" value={form.communityName} onChange={(event) => setForm({ ...form, communityName: event.target.value })}><option value="">Select a community</option>{communities.map((communityName) => <option key={communityName} value={communityName}>{communityName}</option>)}</select></label>}
        {form.role === "owner" && <label className="role-field">Property unit<input required className="role-input" value={form.propertyUnit} onChange={(event) => setForm({ ...form, propertyUnit: event.target.value })} /></label>}
        {form.role === "maintenance_manager" && <label className="role-field">Block<input required className="role-input" value={form.block} onChange={(event) => setForm({ ...form, block: event.target.value })} /></label>}
        {form.role === "service_provider" && <label className="role-field">Service category<input required className="role-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>}
      </div>{state.error && <div className="role-alert" role="alert">{state.error}</div>}<div className="role-actions"><button className="role-button" disabled={state.saving}>{state.saving ? "Saving..." : "Create signup request"}</button><button type="button" className="role-button secondary" onClick={closeCreate}>Cancel</button></div></form>
    </section></div>}

    {selected && <div className="role-modal participant-form-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setEditing(false); } }}><section className={`role-modal-card ${editing ? "participant-form-card" : "participant-details-card"}`} role="dialog" aria-modal="true" aria-labelledby="participant-details-title">{editing ? <>
      <header className="participant-form-header"><div><h2 id="participant-details-title">Edit Participant</h2><p>Update participant details</p></div><button type="button" className="participant-close" aria-label="Close" onClick={() => { setSelected(null); setEditing(false); }}><FiX /></button></header>
      <form className="role-stack participant-edit-form" onSubmit={saveEdit}><div className="participant-form-fields">
        <label className="participant-field">Full Name <span>*</span><input className="role-input" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
        <label className="participant-field">Email <span>*</span><input className="role-input" type="email" required value={selected.email || ""} readOnly title="Email editing is not supported by the user profile API." /></label>
        <label className="participant-field">Contact Number <span>*</span><input className="role-input" type="tel" required value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></label>
        <label className="participant-field">Role Selection <span>*</span><select className="role-select" value={selected.role} disabled aria-label="Role selection (read only)">{["owner", "service_provider", "maintenance_manager", "admin"].map((item) => <option key={item} value={item}>{formatRole(item)}</option>)}</select></label>
      </div>{state.error && <div className="role-alert" role="alert">{state.error}</div>}<div className="participant-form-footer"><button type="button" className="role-button secondary" onClick={() => { setSelected(null); setEditing(false); }}>Cancel</button><button className="role-button" disabled={state.saving}>{state.saving ? "Saving..." : "Save Changes"}</button></div></form>
      </> : <><header className="participant-details-header"><h2 id="participant-details-title">Participant Details</h2><button type="button" className="participant-close" aria-label="Close details" onClick={() => setSelected(null)}><FiX /></button></header><div className="participant-details-content su-participant-detail-content"><ParticipantDetailRow icon={FiUser} tone="blue" label="Participant ID" value={selected.participantCode}/><ParticipantDetailRow icon={FiUser} tone="green" label="Full Name" value={selected.name}/><ParticipantDetailRow icon={FiMail} tone="orange" label="Email Address" value={selected.email}/><ParticipantDetailRow icon={FiBriefcase} tone="purple" label="System Role" value={formatRole(selected.role)}/>{selected.communityName && <ParticipantDetailRow icon={FiGlobe} tone="cyan" label="Community / Society" value={selected.communityName}/>}{selected.propertyUnit && <ParticipantDetailRow icon={FiHome} tone="yellow" label="Property Unit" value={selected.propertyUnit}/>}{selected.block && <ParticipantDetailRow icon={FiHome} tone="yellow" label="Assigned Block" value={`Block ${selected.block}`}/>}<ParticipantDetailRow icon={FiActivity} tone="gray" label="Access Status" value={selected.approvalStatus === "approved" ? "Active" : formatRole(selected.approvalStatus || "approved")} badge/><div className="participant-account-note"><strong>Account Status</strong><span>This participant is registered and active across PropSync services.</span></div></div><footer className="participant-details-footer"><button className="participant-close-button" onClick={() => setSelected(null)}>Close</button></footer></>}</section></div>}
  </main>;
}

function ParticipantDetailRow({ icon: Icon, tone, label, value, badge }) { return <div className="participant-detail-row"><span className={`participant-detail-icon ${tone}`}><Icon /></span><div><small>{label}</small>{badge ? <span className="participant-active-badge">{value}</span> : <strong>{value || "—"}</strong>}</div></div>; }