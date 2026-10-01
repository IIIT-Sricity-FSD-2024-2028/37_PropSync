/* ============================================================
   PARTICIPANTS — Complete System User Repository
   ============================================================ */

async function renderParticipants() {
  const tbody = document.getElementById('participants-tbody');
  if (!tbody) return;

  await refreshParticipantsFromBackend();
  let list = getParticipants();

  // Filter
  list = list.filter(p => {
    const q = (AppState.participantSearch || '').toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.community && p.community.toLowerCase().includes(q));
    const matchRole = !AppState.participantRoleFilter || AppState.participantRoleFilter === 'All Roles' || p.role === AppState.participantRoleFilter;
    return matchSearch && matchRole;
  });

  // Sort
  if (AppState.participantSortBy) {
    const key = AppState.participantSortBy;
    list = [...list].sort((a, b) => {
      const av = (a[key] || '').toLowerCase();
      const bv = (b[key] || '').toLowerCase();
      return AppState.participantSortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td class="id-col">${p.id}</td>
      <td class="name-col">
        <div style="font-weight:600;color:#111827;">${escHtml(p.name)}</div>
        ${p.community ? `<div style="font-size:11px;color:#6b7280;">${escHtml(p.community)}</div>` : ''}
      </td>
      <td>${escHtml(p.email)}</td>
      <td class="role-col">
        <span class="badge ${p.role === 'Administrator' ? 'badge-purple' : p.role === 'Maintenance Manager' ? 'badge-green' : p.role === 'Service Provider' ? 'badge-orange' : 'badge-blue'}">${escHtml(p.role)}</span>
      </td>
      <td>
        <span class="badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Pending' ? 'badge-yellow' : 'badge-gray'}">${p.status}</span>
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" data-action="edit-p" data-id="${p.id}" title="Edit">${ICONS.pencil}</button>
          <button class="action-btn view" data-action="view-p" data-id="${p.id}" title="View Details">${ICONS.eye}</button>
          <button class="action-btn delete" data-action="delete-p" data-id="${p.id}" data-name="${p.name}" title="Delete">${ICONS.trash}</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" style="text-align:center;padding:32px;color:#9ca3af;">No participants found</td></tr>`;
}

function handleParticipantSort(field) {
  if (AppState.participantSortBy === field) {
    AppState.participantSortOrder = AppState.participantSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    AppState.participantSortBy = field;
    AppState.participantSortOrder = 'asc';
  }
  const label = document.getElementById('sort-label');
  if (label) {
    const order = AppState.participantSortOrder === 'asc' ? 'A-Z' : 'Z-A';
    const fieldLabel = field === 'id' ? 'ID' : field.charAt(0).toUpperCase() + field.slice(1);
    label.textContent = `${fieldLabel} (${order})`;
  }
  renderParticipants();
}

/* ---- Edit Participant Modal ---- */
function openEditParticipantModal(id) {
  const list = getParticipants();
  const p = list.find(x => x.id === id);
  if (!p) return;
  AppState.selectedParticipant = p;
  document.getElementById('ep-id').value = p.id;
  document.getElementById('ep-name').value = p.name;
  document.getElementById('ep-email').value = p.email;
  document.getElementById('ep-role').value = p.role;
  document.getElementById('ep-contact').value = p.phone || '+91 9876543210';
  document.getElementById('ep-name-error').textContent = '';
  document.getElementById('ep-contact-error').textContent = '';
  openModal('edit-participant-modal');
}

/* ---- View Participant Modal ---- */
function openViewParticipantModal(id) {
  const p = getParticipants().find(x => x.id === id);
  if (!p) return;
  document.getElementById('view-participant-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${vpRow(ICONS.user,      'background:#dbeafe;color:#2563eb', 'Participant ID',  p.id)}
      ${vpRow(ICONS.user,      'background:#dcfce7;color:#16a34a', 'Full Name',       p.name)}
      ${vpRow(ICONS.mail,      'background:#ffedd5;color:#ea580c', 'Email Address',   p.email)}
      ${vpRow(ICONS.briefcase, 'background:#f3e8ff;color:#9333ea', 'System Role',    `<span style="font-weight:600;">${p.role}</span>`)}
      ${p.community ? vpRow(ICONS.globe, 'background:#e0f2fe;color:#0284c7', 'Community / Society', p.community) : ''}
      ${p.propertyUnit ? vpRow(ICONS.home, 'background:#fef9c3;color:#a16207', 'Property Unit', p.propertyUnit) : ''}
      ${p.block ? vpRow(ICONS.wrench, 'background:#f0fdf4;color:#16a34a', 'Assigned Block', `Block ${p.block}`) : ''}
      ${vpRow(ICONS.activity,  'background:#f3f4f6;color:#4b5563', 'Access Status',
        `<span class="badge ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}">${p.status}</span>`)}
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-top:4px;">
        <p style="font-size:12px;font-weight:600;color:#1e40af;margin-bottom:4px;">Account Status</p>
        <p style="font-size:12px;color:#1d4ed8;margin:0;">This participant is registered and active across PropSync services.</p>
      </div>
    </div>
  `;
  openModal('view-participant-modal');
}

function vpRow(iconHtml, iconStyle, label, value) {
  return `
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div style="width:36px;height:36px;border-radius:8px;${iconStyle};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconHtml}</div>
      <div>
        <p style="font-size:12px;color:#6b7280;margin:0 0 2px;">${label}</p>
        <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${value}</p>
      </div>
    </div>
  `;
}
