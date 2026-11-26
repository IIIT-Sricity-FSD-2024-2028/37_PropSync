import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { FiActivity, FiArrowDown, FiArrowUp, FiBriefcase, FiChevronDown, FiEdit2, FiEye, FiFilter, FiGlobe, FiHome, FiMail, FiPlus, FiSearch, FiTrash2, FiUser, FiX } from "react-icons/fi";
import { formatRole, getRoleSession } from "../../services/roleApi";
import {
  clearUserMutation,
  selectUserById, selectUserDetailStatus, selectUserMutation, selectUsers,
  selectUsersListStatus,
} from "../../redux/features/users/usersSlice";
import { createUser, fetchUserById, fetchUsers, removeUser, saveUser } from "../../services/usersService";
import "./SuperUserPages.css";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", role: "owner", communityName: "", propertyUnit: "", block: "", category: "" };

export default function SuperUserParticipants() {
  const session = getRoleSession("super_user");
  const dispatch = useDispatch();
  const { getState } = useStore();
  const users = useSelector((state) => selectUsers(state, session));
  const list = useSelector((state) => selectUsersListStatus(state, session));
  const detail = useSelector((state) => selectUserDetailStatus(state, session));
  const mutation = useSelector((state) => selectUserMutation(state, session));
  const loading = list.status === "idle" || list.status === "loading";
  const saving = mutation.status === "loading";
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("participantCode");
  const [dir, setDir] = useState("asc");
  const [selectedId, setSelectedId] = useState(null);
  const selected = useSelector((state) => selectUserById(state, session, selectedId));
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", communityName: "", propertyUnit: "", block: "" });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState("");
  const { role: sessionRole, id: sessionId } = session;
  useEffect(() => {
    const controller = new AbortController();
    fetchUsers({ dispatch, getState }, {
      session: { role: sessionRole, id: sessionId }, signal: controller.signal,
    }).catch(() => { /* Redux exposes the request error. */ });
    return () => controller.abort();
  }, [dispatch, getState, sessionRole, sessionId]);

  const resetFeedback = () => {
    dispatch(clearUserMutation(session));
    setSuccess("");
  };
  const viewUser = (user) => {
    resetFeedback();
    setEditing(false);
    setSelectedId(user.id);
    fetchUserById({ dispatch, getState }, { session, id: user.id })
      .catch(() => { /* Redux exposes the request error. */ });
  };
  const error = mutation.error || (selected && !editing ? detail.error : null) || list.error;
  const communities = useMemo(() => [...new Set(users.map((user) => user.communityName).filter(Boolean))].sort(), [users]);
  const filtered = useMemo(() => users.map((user) => ({
    ...user,
    participantCode: `P${String(user.id).padStart(3, "0")}`,
  })).filter((user) => {
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
    if (saving) return;
    resetFeedback();
    const payload = { ...form };
    if (payload.role === "service_provider") payload.communityName = undefined;
    if (payload.role !== "owner") payload.propertyUnit = undefined;
    if (payload.role !== "maintenance_manager") payload.block = undefined;
    if (payload.role !== "service_provider") payload.category = undefined;
    try {
      await createUser({ dispatch, getState }, { session, data: payload });
      closeCreate();
      setSuccess("Signup request created. It will appear after approval.");
    } catch { /* Redux exposes the request error. */ }
  };

  const openEdit = (user) => {
    setSelectedId(user.id);
    setEditing(true);
    setEditForm({ name: user.name || "", phone: user.phone || "", communityName: user.communityName || "", propertyUnit: user.propertyUnit || "", block: user.block || "" });
    resetFeedback();
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (saving || !selected) return;
    resetFeedback();
    try {
      await saveUser({ dispatch, getState }, { session, id: selected.id, data: editForm });
      setEditing(false);
      setSelectedId(null);
      setSuccess("Participant updated successfully.");
    } catch { /* Redux exposes the request error. */ }
  };

  const deleteParticipant = async (user) => {
    if (saving || !window.confirm(`Delete ${user.name}? This removes the participant account.`)) return;
    resetFeedback();
    try {
      await removeUser({ dispatch, getState }, { session, id: user.id });
      setSelectedId(null);
      setSuccess("Participant deleted successfully.");
    } catch { /* Redux exposes the request error. */ }
  };

  return <main className="role-page superuser-role-page superuser-participants">
    <header className="role-head"><div><h1>Manage Participants</h1><p>Control panel for managing system users across all roles</p></div></header>
    {error && <div className="role-alert" role="alert">{error}</div>}
    {success && <div className="role-alert success" role="status">{success}</div>}
    <section className="role-toolbar su-participant-toolbar" aria-label="Participant search and filters">
      <label className="su-participant-search"><FiSearch aria-hidden="true" /><input className="role-input" placeholder="Search by name, ID, or email..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search participants" /></label>
      <label className="su-participant-select"><FiFilter aria-hidden="true" /><select className="role-select" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All Roles</option>{["owner", "maintenance_manager", "service_provider", "admin"].map((value) => <option key={value} value={value}>{formatRole(value)}</option>)}</select><FiChevronDown className="su-select-chevron" aria-hidden="true" /></label>
      <label className="su-participant-select su-sort-select"><span className="su-sort-indicator" aria-hidden="true"><FiArrowUp /><FiArrowDown /></span><select className="role-select" value={`${sort}:${dir}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSort(field); setDir(direction); }} aria-label="Sort participants"><option value="participantCode:asc">Sort By</option><option value="participantCode:desc">Participant ID (High to Low)</option><option value="name:asc">Name (A-Z)</option><option value="id:asc">ID (Low to High)</option><option value="email:asc">Email (A-Z)</option><option value="name:desc">Name (Z-A)</option></select><FiChevronDown className="su-select-chevron" aria-hidden="true" /></label>
      <button type="button" className="role-button su-add-participant" onClick={() => { setForm({ ...EMPTY_FORM, communityName: communities[0] || "" }); setCreating(true); resetFeedback(); }}><FiPlus /> Add Participant</button>
    </section>
    <div className="role-table-wrap su-participants-table"><table className="role-table"><thead><tr><th><button type="button" onClick={() => changeSort("participantCode")}>Participant ID <span className="su-sort-indicator" aria-hidden="true"><FiArrowUp /><FiArrowDown /></span></button></th><th><button type="button" onClick={() => changeSort("name")}>Name <span className="su-sort-indicator" aria-hidden="true"><FiArrowUp /><FiArrowDown /></span></button></th><th><button type="button" onClick={() => changeSort("email")}>Email <span className="su-sort-indicator" aria-hidden="true"><FiArrowUp /><FiArrowDown /></span></button></th><th>Role</th><th>Access Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}>
      <td className="su-participant-code">{user.participantCode}</td>
      <td className="su-participant-name"><strong>{user.name}</strong>{user.communityName && <small>{user.communityName}</small>}</td>
      <td className="su-participant-email">{user.email}</td>
      <td><span className={`su-role-pill ${user.role}`}>{formatRole(user.role)}</span></td>
      <td><span className={`su-access-pill ${user.approvalStatus || "approved"}`}>{user.approvalStatus === "approved" ? "Active" : formatRole(user.approvalStatus || "approved")}</span></td>
      <td><div className="su-participant-actions"><button type="button" className="edit" disabled={saving} title="Edit participant" aria-label="Edit participant" onClick={() => openEdit(user)}><FiEdit2 /></button><button type="button" className="view" disabled={saving} title="View participant" aria-busy={selectedId === user.id && detail.status === "loading"} aria-label="View participant" onClick={() => viewUser(user)}><FiEye /></button><button type="button" className="delete" disabled={saving} title="Delete participant" aria-label="Delete participant" onClick={() => deleteParticipant(user)}><FiTrash2 /></button></div></td>
    </tr>)}</tbody></table>
      {loading && <div className="role-empty">Loading platform participants...</div>}
      {list.status === "succeeded" && filtered.length === 0 && <div className="role-empty">No participants match these filters.</div>}
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
      </div>{error && <div className="role-alert" role="alert">{error}</div>}<div className="role-actions"><button className="role-button" disabled={saving}>{saving ? "Saving..." : "Create signup request"}</button><button type="button" className="role-button secondary" onClick={closeCreate}>Cancel</button></div></form>
    </section></div>}

    {selected && <div className="role-modal participant-form-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedId(null); setEditing(false); } }}><section className={`role-modal-card ${editing ? "participant-form-card" : "participant-details-card"}`} role="dialog" aria-modal="true" aria-labelledby="participant-details-title">{editing ? <>
      <header className="participant-form-header"><div><h2 id="participant-details-title">Edit Participant</h2><p>Update participant details</p></div><button type="button" className="participant-close" aria-label="Close" onClick={() => { setSelectedId(null); setEditing(false); }}><FiX /></button></header>
      <form className="role-stack participant-edit-form" onSubmit={saveEdit}><div className="participant-form-fields">
        <label className="participant-field">Full Name <span>*</span><input className="role-input" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
        <label className="participant-field">Email <span>*</span><input className="role-input" type="email" required value={selected.email || ""} readOnly title="Email editing is not supported by the user profile API." /></label>
        <label className="participant-field">Contact Number <span>*</span><input className="role-input" type="tel" required value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></label>
        <label className="participant-field">Role Selection <span>*</span><select className="role-select" value={selected.role} disabled aria-label="Role selection (read only)">{["owner", "service_provider", "maintenance_manager", "admin"].map((item) => <option key={item} value={item}>{formatRole(item)}</option>)}</select></label>
      </div>{error && <div className="role-alert" role="alert">{error}</div>}<div className="participant-form-footer"><button type="button" className="role-button secondary" onClick={() => { setSelectedId(null); setEditing(false); }}>Cancel</button><button className="role-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div></form>
      </> : <><header className="participant-details-header"><h2 id="participant-details-title">Participant Details</h2><button type="button" className="participant-close" aria-label="Close details" onClick={() => setSelectedId(null)}><FiX /></button></header><div className="participant-details-content su-participant-detail-content"><ParticipantDetailRow icon={FiUser} tone="blue" label="Participant ID" value={`P${String(selected.id).padStart(3, "0")}`}/><ParticipantDetailRow icon={FiUser} tone="green" label="Full Name" value={selected.name}/><ParticipantDetailRow icon={FiMail} tone="orange" label="Email Address" value={selected.email}/><ParticipantDetailRow icon={FiBriefcase} tone="purple" label="System Role" value={formatRole(selected.role)}/>{selected.communityName && <ParticipantDetailRow icon={FiGlobe} tone="cyan" label="Community / Society" value={selected.communityName}/>}{selected.propertyUnit && <ParticipantDetailRow icon={FiHome} tone="yellow" label="Property Unit" value={selected.propertyUnit}/>}{selected.block && <ParticipantDetailRow icon={FiHome} tone="yellow" label="Assigned Block" value={`Block ${selected.block}`}/>}<ParticipantDetailRow icon={FiActivity} tone="gray" label="Access Status" value={selected.approvalStatus === "approved" ? "Active" : formatRole(selected.approvalStatus || "approved")} badge/><div className="participant-account-note"><strong>Account Status</strong><span>This participant is registered and active across PropSync services.</span></div></div><footer className="participant-details-footer"><button className="participant-close-button" onClick={() => setSelectedId(null)}>Close</button></footer></>}</section></div>}
  </main>;
}

function ParticipantDetailRow({ icon: Icon, tone, label, value, badge }) { return <div className="participant-detail-row"><span className={`participant-detail-icon ${tone}`}><Icon /></span><div><small>{label}</small>{badge ? <span className="participant-active-badge">{value}</span> : <strong>{value || "—"}</strong>}</div></div>; }
