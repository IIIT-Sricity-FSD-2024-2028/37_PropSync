import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { FiActivity, FiArrowDown, FiBriefcase, FiEdit2, FiEye, FiMail, FiTrash2, FiUser, FiX } from "react-icons/fi";
import { formatRole, getRoleSession } from "../../services/roleApi";
import {
  clearUserMutation,
  selectUserById, selectUserDetailStatus, selectUserMutation, selectUsers,
  selectUsersListStatus,
} from "../../redux/features/users/usersSlice";
import { createUser, fetchUserById, fetchUsers, removeUser, saveUser } from "../../services/usersService";
import "./AdminPages.css";

const emptyForm = { name: "", email: "", password: "", phone: "", role: "owner", propertyUnit: "", block: "", category: "" };

export default function AdministratorParticipants() {
  const session = getRoleSession("admin");
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
  const [sort, setSort] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedId, setSelectedId] = useState(null);
  const selected = useSelector((state) => selectUserById(state, session, selectedId));
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
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
    setFormError("");
    setSuccess("");
  };
  const viewUser = (user) => {
    resetFeedback();
    setEditing(false);
    setSelectedId(user.id);
    fetchUserById({ dispatch, getState }, { session, id: user.id })
      .catch(() => { /* Redux exposes the request error. */ });
  };
  const error = formError || mutation.error || (selected && !editing ? detail.error : null) || list.error;
  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matches = !query || [user.name, user.email, user.id].some((value) => String(value ?? "").toLowerCase().includes(query));
    return user.approvalStatus === "approved" && user.role !== "admin" && matches && (role === "all" || user.role === role);
  }).sort((a,b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), undefined, { numeric: true }) * (sortDir === "asc" ? 1 : -1)), [users, search, role, sort, sortDir]);
  const changeSort = (field) => { if (field === sort) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSort(field); setSortDir("asc"); } };
  const openCreate = () => { setForm(emptyForm); setEditing(false); setCreating(true); setSelectedId(null); resetFeedback(); };
  const openEdit = (user) => { setSelectedId(user.id); setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "", role: user.role || "owner", propertyUnit: user.propertyUnit || "", block: user.block || "" }); setEditing(true); setCreating(false); resetFeedback(); };
  const closeModal = () => { setCreating(false); setEditing(false); setSelectedId(null); };
  const submit = async (event) => {
    event.preventDefault();
    if (saving || (!creating && !selected)) return;
    resetFeedback();
    try {
      if (creating) {
        const payload = { ...form, communityName: form.role === "service_provider" ? undefined : session.communityName };
        if (!payload.communityName && form.role !== "service_provider") {
          setFormError("Your session does not include a community name; participant signup cannot be scoped safely.");
          return;
        }
        await createUser({ dispatch, getState }, { session, data: payload });
        setForm(emptyForm);
        setSuccess("Signup request created. It will appear after approval.");
      } else {
        const payload = Object.fromEntries(Object.entries(form).filter(([key]) => ["name", "phone", "propertyUnit", "block"].includes(key)));
        await saveUser({ dispatch, getState }, { session, id: selected.id, data: payload });
        closeModal();
        setSuccess("Participant updated.");
      }
    } catch { /* Redux exposes the request error. */ }
  };
  const remove = async (user) => {
    if (saving || !window.confirm(`Delete ${user.name}? This removes the participant account.`)) return;
    resetFeedback();
    try {
      await removeUser({ dispatch, getState }, { session, id: user.id });
      setSuccess("Participant deleted.");
    } catch { /* Redux exposes the request error. */ }
  };
  return <main className="role-page admin-role-page admin-participants">
    <header className="role-head"><div><h1>Manage Participants</h1><p>Participants visible to your community administrator account.</p></div><button className="role-button" onClick={openCreate}>Add Participant</button></header>
    {error && <div className="role-alert" role="alert">{error}</div>}{success && <div className="role-alert success" role="status">{success}</div>}
    <div className="admin-participant-toolbar"><input className="role-input" aria-label="Search participants" placeholder="Search by name, ID, or email..." value={search} onChange={(e)=>setSearch(e.target.value)} /><select className="role-select" aria-label="Filter by role" value={role} onChange={(e)=>setRole(e.target.value)}><option value="all">All Roles</option>{["owner","service_provider","maintenance_manager"].map((item)=><option value={item} key={item}>{formatRole(item)}</option>)}</select><select className="role-select" aria-label="Sort participants" value={`${sort}:${sortDir}`} onChange={(e)=>{const [field,direction]=e.target.value.split(":");setSort(field);setSortDir(direction);}}><option value="name:asc">Sort By: Name (A–Z)</option><option value="name:desc">Name (Z–A)</option><option value="id:asc">ID (A–Z)</option><option value="email:asc">Email (A–Z)</option></select><span className="role-muted">{filtered.length} participants</span><button className="role-button secondary" onClick={() => fetchUsers({ dispatch, getState }, { session }).catch(() => { /* Redux exposes the request error. */ })} disabled={loading}>Refresh</button></div>
    <div className="role-table-wrap admin-participants-table"><table className="role-table"><thead><tr><th><button onClick={()=>changeSort("id")}>Participant ID <FiArrowDown aria-hidden="true" />{sort==="id"?` (${sortDir})`:""}</button></th><th><button onClick={()=>changeSort("name")}>Name <FiArrowDown aria-hidden="true" />{sort==="name"?` (${sortDir})`:""}</button></th><th><button onClick={()=>changeSort("email")}>Email <FiArrowDown aria-hidden="true" />{sort==="email"?` (${sortDir})`:""}</button></th><th>Role</th><th>Access Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((user)=><tr key={user.id}><td className="admin-id-cell">P{String(user.id).padStart(3,"0")}</td><td className="admin-name-cell"><strong>{user.name}</strong>{user.communityName&&<small>{user.communityName}</small>}</td><td>{user.email}</td><td><span className={`admin-role-badge ${user.role}`}>{formatRole(user.role)}</span></td><td><span className="admin-access-badge">{user.approvalStatus === "approved" ? "Active" : user.approvalStatus || "Active"}</span></td><td><div className="admin-icon-actions"><button className="edit" disabled={saving} title="Edit participant" aria-label="Edit participant" onClick={()=>openEdit(user)}><FiEdit2 /></button><button className="view" disabled={saving} title="View participant" aria-busy={selectedId === user.id && detail.status === "loading"} aria-label="View participant" onClick={()=>viewUser(user)}><FiEye /></button><button className="delete" disabled={saving} title="Delete participant" aria-label="Delete participant" onClick={()=>remove(user)}><FiTrash2 /></button></div></td></tr>)}</tbody></table>{loading&&<div className="role-empty">Loading community participants...</div>}{list.status==="succeeded"&&filtered.length===0&&<div className="role-empty">No participants match this search and role filter.</div>}</div>
    {(creating||editing)&&<div className="role-modal admin-participant-form-modal" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)closeModal();}}><section className="role-modal-card participant-form-card" role="dialog" aria-modal="true" aria-labelledby="participant-form-title"><div className="participant-form-header"><div><h2 id="participant-form-title">{creating?"Add participant signup":"Edit Participant"}</h2>{editing&&<p>Update participant details</p>}</div><button className="participant-close" type="button" aria-label="Close" onClick={closeModal}><FiX /></button></div>{creating&&<p className="participant-create-note">New accounts are created as pending signup requests and follow the backend approval workflow.</p>}<form onSubmit={submit} className="role-stack"><div className="participant-form-fields">
      <label className="participant-field">Full Name <span>*</span><input required className="role-input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label>
      {editing&&<label className="participant-field">Email <span>*</span><input required type="email" className="role-input" value={form.email||""} readOnly title="Email editing is not supported by the user profile API."/></label>}
      {creating&&<><label className="role-field">Email<input required type="email" className="role-input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label><label className="role-field">Temporary password<input required minLength="6" type="password" className="role-input" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/></label><label className="role-field">Role<select className="role-select" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}><option value="owner">Property Owner</option><option value="maintenance_manager">Maintenance Manager</option><option value="service_provider">Service Provider</option></select></label></>}
      <label className="participant-field">Contact Number <span>*</span><input type="tel" required className="role-input" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></label>
      {editing&&<label className="participant-field">Role Selection <span>*</span><select className="role-select" value={form.role} disabled aria-label="Role selection (read only)">{["owner","service_provider","maintenance_manager","admin"].map((item)=><option key={item} value={item}>{formatRole(item)}</option>)}</select></label>}
      {(creating?form.role==="owner":Boolean(form.propertyUnit))&&<label className="role-field">Property unit<input className="role-input" value={form.propertyUnit} onChange={(e)=>setForm({...form,propertyUnit:e.target.value})}/></label>}
      {(creating?form.role==="maintenance_manager":Boolean(form.block))&&<label className="role-field">Block<input className="role-input" value={form.block} onChange={(e)=>setForm({...form,block:e.target.value})}/></label>}
      {creating&&form.role==="service_provider"&&<label className="role-field">Service category<input required className="role-input" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/></label>}
      </div>{error&&<div className="role-alert">{error}</div>}<div className="participant-form-footer"><button className="role-button secondary" type="button" onClick={closeModal}>Cancel</button><button className="role-button" disabled={saving}>{saving?"Saving...":creating?"Create signup request":"Save Changes"}</button></div></form></section></div>}
    {selected&&!editing&&!creating&&<div className="role-modal participant-details-overlay" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedId(null);}}><section className="role-modal-card participant-details-card" role="dialog" aria-modal="true" aria-labelledby="participant-details-title"><header className="participant-details-header"><h2 id="participant-details-title">Participant Details</h2><button type="button" className="participant-close" aria-label="Close details" onClick={()=>setSelectedId(null)}><FiX /></button></header><div className="participant-details-content"><ParticipantDetailRow icon={FiUser} tone="blue" label="Participant ID" value={`P${String(selected.id).padStart(3,"0")}`}/><ParticipantDetailRow icon={FiUser} tone="green" label="Full Name" value={selected.name}/><ParticipantDetailRow icon={FiMail} tone="orange" label="Email Address" value={selected.email}/><ParticipantDetailRow icon={FiBriefcase} tone="purple" label="Role" value={formatRole(selected.role)} highlight/><ParticipantDetailRow icon={FiActivity} tone="gray" label="Access Status" value="Active" badge/><div className="participant-account-note"><strong>Account Information</strong><span>This participant has been registered in the PropSync system. To modify permissions or access levels, please visit the Role Management section.</span></div></div><footer className="participant-details-footer"><button className="participant-close-button" onClick={()=>setSelectedId(null)}>Close</button></footer></section></div>}
  </main>;
}

function ParticipantDetailRow({icon:Icon,tone,label,value,highlight,badge}){return <div className="participant-detail-row"><span className={`participant-detail-icon ${tone}`}><Icon /></span><div><small>{label}</small>{badge?<span className="participant-active-badge">{value}</span>:<strong className={highlight?"highlight":""}>{value||"—"}</strong>}</div></div>;}

