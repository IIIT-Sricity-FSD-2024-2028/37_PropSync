/* ============================================================
   ROLES — Render roles grid and permissions editor
   ============================================================ */

function renderRoles() {
  const grid = document.getElementById('roles-grid');
  if (!grid) return;

  const roles = getRoles();
  grid.innerHTML = roles.map(role => `
    <div class="role-card ${role.borderClass}">
      <div class="role-card-header ${role.bgClass}">
        <span class="${role.textClass}" style="display:flex;">${ICONS[role.iconType]}</span>
      </div>
      <div class="role-card-body">
        <h3>${role.name}</h3>
        <div class="role-user-count">${ICONS.users}<span>${role.userCount}</span></div>
        <p class="role-description">${role.description}</p>
        <div class="permissions-label">Permissions</div>
        <div style="margin-bottom:12px;">
          ${role.permissions.map(perm => `
            <div class="permission-item">
              <span class="${role.textClass}" style="display:flex;">${ICONS.check}</span>
              <span>${perm}</span>
            </div>
          `).join('')}
        </div>
        <button class="edit-role-btn" data-role-id="${role.id}">Edit Role Permissions</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.edit-role-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditRoleModal(parseInt(btn.dataset.roleId)));
  });
}

function openEditRoleModal(roleId) {
  const roles = getRoles();
  const role = roles.find(r => r.id === roleId);
  if (!role) return;
  AppState.editingRoleId = roleId;
  AppState.editedPermissions = [...role.permissions];
  document.getElementById('edit-role-name').textContent = role.name;
  renderRolePermissionsEditor();
  openModal('edit-role-modal');
}

function renderRolePermissionsEditor() {
  const body = document.getElementById('edit-role-body');
  if (!body) return;
  body.innerHTML = `
    <div id="perms-list">
      ${AppState.editedPermissions.map((perm, i) => `
        <div class="perm-edit-row">
          <input type="text" class="form-control" value="${escHtml(perm)}" data-perm-idx="${i}" />
          <button class="perm-del-btn" data-del-perm="${i}">${ICONS.trash}</button>
        </div>
      `).join('')}
    </div>
    <div class="perm-add-row">
      <input type="text" class="form-control" id="new-perm-input" placeholder="Add new permission..." />
      <button class="perm-add-btn" id="add-perm-btn">${ICONS.plus}</button>
    </div>
  `;

  body.querySelectorAll('[data-perm-idx]').forEach(input => {
    input.addEventListener('input', () => {
      AppState.editedPermissions[parseInt(input.dataset.permIdx)] = input.value;
    });
  });

  body.querySelectorAll('[data-del-perm]').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.editedPermissions.splice(parseInt(btn.dataset.delPerm), 1);
      renderRolePermissionsEditor();
    });
  });

  const newInput = document.getElementById('new-perm-input');
  const addBtn  = document.getElementById('add-perm-btn');

  const addPerm = () => {
    const val = newInput.value.trim();
    if (val) {
      AppState.editedPermissions.push(val);
      newInput.value = '';
      renderRolePermissionsEditor();
    }
  };

  addBtn.addEventListener('click', addPerm);
  newInput.addEventListener('keypress', e => { if (e.key === 'Enter') addPerm(); });
}

function saveRolePermissions() {
  if (AppState.editingRoleId === null) return;
  const roles = getRoles();
  const updated = roles.map(r =>
    r.id === AppState.editingRoleId ? { ...r, permissions: [...AppState.editedPermissions] } : r
  );
  saveRoles(updated);
  renderRoles();
  closeModal('edit-role-modal');
  AppState.editingRoleId = null;
  AppState.editedPermissions = [];
}
