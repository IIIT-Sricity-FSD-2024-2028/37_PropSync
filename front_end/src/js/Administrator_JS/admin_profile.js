/* ============================================================
   PROFILE — Render, edit mode, save, change password
   ============================================================ */

function renderProfile() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  const u        = AppState.userProfile || {};
  const fullName = u.fullName || 'Administrator';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';

  container.innerHTML = `
    <!-- Profile Information Card -->
    <div class="profile-card">
      <div class="profile-card-header">
        <h2>Profile Information</h2>
        <div id="profile-edit-btns">
          <button class="btn btn-blue" id="edit-profile-btn">${ICONS.edit}<span>Edit Profile</span></button>
        </div>
      </div>
      <div class="profile-flex">
        <div class="profile-avatar-area">
          <div class="profile-avatar" id="profile-avatar">${initials}</div>
          <p class="profile-emp-id">Employee ID: ${u.employeeId || 'EMP-001'}</p>
        </div>
        <div class="profile-details" id="profile-fields-view">
          ${profileField(ICONS.user,     'Full Name',     fullName,              'fullName')}
          ${profileField(ICONS.mail,     'Email Address', u.email || '',         'email')}
          ${profileField(ICONS.phone,    'Phone Number',  u.phone || '',         'phone')}
          ${profileField(ICONS.shield,   'Role',          u.role || 'Administrator', 'role', true)}
          ${profileField(ICONS.activity, 'Department',    u.department || 'Society Administration', 'department')}
          ${profileField(ICONS.calendar, 'Join Date',     u.joinDate || 'Jan 15, 2024',          'joinDate')}
          ${profileField(ICONS.map,      'Location',      u.location || 'Society Office',        'location')}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions" style="grid-template-columns: 1fr;">
      <!-- Change Password -->
      <div class="quick-action-card">
        <div class="quick-action-icon" style="background:#dbeafe;color:#2563eb;">${ICONS.lock}</div>
        <h3>Change Password</h3>
        <p>Update your account password</p>
        <div class="qa-footer">
          <button class="qa-btn qa-btn-blue" id="open-change-pw">Update Password</button>
        </div>
      </div>
    </div>
  `;

  // Bind profile quick-action buttons safely
  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) editBtn.addEventListener('click', () => enterProfileEditMode());

  const changePwBtn = document.getElementById('open-change-pw');
  if (changePwBtn) {
    changePwBtn.addEventListener('click', () => {
      const cur = document.getElementById('cp-current');
      const nw = document.getElementById('cp-new');
      const conf = document.getElementById('cp-confirm');
      const err = document.getElementById('cp-error');
      if (cur) cur.value = '';
      if (nw) nw.value = '';
      if (conf) conf.value = '';
      if (err) err.textContent = '';
      openModal('change-password-modal');
    });
  }
}

function profileField(iconHtml, label, value, field, isRole = false) {
  return `
    <div class="profile-field">
      <label>${iconHtml}${label}</label>
      ${isRole
        ? `<span class="admin-badge">${escHtml(value)}</span>`
        : `<p class="profile-field-val" data-field="${field}">${escHtml(value)}</p>`}
    </div>
  `;
}

function enterProfileEditMode() {
  const u = AppState.userProfile || {};

  const fieldsView = document.getElementById('profile-fields-view');
  if (!fieldsView) return;
  fieldsView.innerHTML = `
    <div class="form-group">
      <label>Full Name <span class="req">*</span></label>
      <input type="text" id="pf-name" class="form-control" value="${escHtml(u.fullName || '')}" placeholder="John Doe" />
      <p class="form-error" id="pf-name-error"></p>
    </div>
    <div class="form-group">
      <label>Email Address <span class="req">*</span></label>
      <input type="email" id="pf-email" class="form-control" value="${escHtml(u.email || '')}" placeholder="email@example.com" />
    </div>
    <div class="form-group">
      <label>Phone Number <span class="req">*</span></label>
      <input type="tel" id="pf-phone" class="form-control" value="${escHtml(u.phone || '')}" placeholder="+1 (555) 987-6543" />
      <p class="form-error" id="pf-phone-error"></p>
    </div>
    <div class="form-group">
      <label>Department</label>
      <input type="text" id="pf-dept" class="form-control" value="${escHtml(u.department || '')}" placeholder="Society Administration" />
    </div>
    <div class="form-group">
      <label>Location</label>
      <input type="text" id="pf-location" class="form-control" value="${escHtml(u.location || '')}" placeholder="Society Office" />
    </div>
  `;

  // Live validation
  const pfName = document.getElementById('pf-name');
  if (pfName) {
    pfName.addEventListener('input', function () {
      const err = validateParticipantName(this.value);
      const errEl = document.getElementById('pf-name-error');
      if (errEl) errEl.textContent = err;
      this.classList.toggle('error', !!err);
    });
  }
  const pfPhone = document.getElementById('pf-phone');
  if (pfPhone) {
    pfPhone.addEventListener('input', function () {
      const err = validateParticipantContact(this.value);
      const errEl = document.getElementById('pf-phone-error');
      if (errEl) errEl.textContent = err;
      this.classList.toggle('error', !!err);
    });
  }

  // Swap header buttons
  const editBtns = document.getElementById('profile-edit-btns');
  if (editBtns) {
    editBtns.innerHTML = `
      <button class="btn btn-green" id="save-profile-btn">${ICONS.save}<span>Save</span></button>
      <button class="btn btn-outline" id="cancel-profile-btn" style="margin-left:8px;">${ICONS.x}<span>Cancel</span></button>
    `;
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    const cancelBtn = document.getElementById('cancel-profile-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => renderProfile());
  }
}

function saveProfile() {
  const nameEl = document.getElementById('pf-name');
  const emailEl = document.getElementById('pf-email');
  const phoneEl = document.getElementById('pf-phone');
  const deptEl = document.getElementById('pf-dept');
  const locEl = document.getElementById('pf-location');

  if (!nameEl || !emailEl) return;

  const name     = nameEl.value.trim();
  const email    = emailEl.value.trim();
  const phone    = phoneEl ? phoneEl.value.trim() : '';
  const dept     = deptEl ? deptEl.value.trim() : '';
  const location = locEl ? locEl.value.trim() : '';

  if (!name || !email) {
    alert('Please fill in all required fields');
    return;
  }
  const nameErr  = validateParticipantName(name);
  const phoneErr = validateParticipantContact(phone);
  if (nameErr || phoneErr) {
    alert('Please fix the validation errors before saving');
    return;
  }

  AppState.userProfile.fullName   = name;
  AppState.userProfile.email      = email;
  AppState.userProfile.phone      = phone;
  AppState.userProfile.department = dept;
  AppState.userProfile.location   = location;

  saveUserProfile(AppState.userProfile);
  updateHeaderUsername();
  renderProfile();
}

function changePassword(current, newPass, confirm) {
  const errorEl = document.getElementById('cp-error');
  if (!current || !newPass || !confirm) {
    if (errorEl) errorEl.textContent = 'All fields are required';
    return;
  }
  const passErr = validateParticipantPassword(newPass);
  if (passErr) {
    if (errorEl) errorEl.textContent = passErr;
    return;
  }
  if (newPass !== confirm) {
    if (errorEl) errorEl.textContent = 'New passwords do not match';
    return;
  }
  alert('Password changed successfully!');
  closeModal('change-password-modal');
  ['cp-current', 'cp-new', 'cp-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  if (errorEl) errorEl.textContent = '';
}
