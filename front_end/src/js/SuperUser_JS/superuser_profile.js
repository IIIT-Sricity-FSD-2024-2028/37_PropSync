/* ============================================================
   PROFILE — Render, edit mode, save, change password
   ============================================================ */

function renderProfile() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  const u        = AppState.userProfile;
  const initials = u.fullName.split(' ').map(n => n[0]).join('').toUpperCase();

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
          <p class="profile-emp-id">Employee ID: ${u.employeeId}</p>
        </div>
        <div class="profile-details" id="profile-fields-view">
          ${profileField(ICONS.user,     'Full Name',     u.fullName,   'fullName')}
          ${profileField(ICONS.mail,     'Email Address', u.email,      'email')}
          ${profileField(ICONS.phone,    'Phone Number',  u.phone,      'phone')}
          ${profileField(ICONS.shield,   'Role',          u.role,       'role', true)}
          ${profileField(ICONS.activity, 'Department',    u.department, 'department')}
          ${profileField(ICONS.calendar, 'Join Date',     u.joinDate,   'joinDate')}
          ${profileField(ICONS.map,      'Location',      u.location,   'location')}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <!-- Change Password -->
      <div class="quick-action-card">
        <div class="quick-action-icon" style="background:#dbeafe;color:#2563eb;">${ICONS.lock}</div>
        <h3>Change Password</h3>
        <p>Update your account password</p>
        <div class="qa-footer">
          <button class="qa-btn qa-btn-blue" id="open-change-pw">Update Password</button>
        </div>
      </div>
      <!-- Notification Preferences -->
      <div class="quick-action-card">
        <div class="quick-action-icon" style="background:#fef3c7;color:#ca8a04;">${ICONS.bell}</div>
        <h3>Notification Preferences</h3>
        <p>Manage notification settings</p>
        <div class="qa-footer">
          <button class="qa-btn qa-btn-yellow" id="open-notif-pref">Configure</button>
        </div>
      </div>
    </div>
  `;

  // Bind profile quick-action buttons
  document.getElementById('edit-profile-btn').addEventListener('click', () => enterProfileEditMode());
  document.getElementById('open-change-pw').addEventListener('click', () => {
    document.getElementById('cp-current').value = '';
    document.getElementById('cp-new').value     = '';
    document.getElementById('cp-confirm').value = '';
    document.getElementById('cp-error').textContent = '';
    openModal('change-password-modal');
  });
  document.getElementById('open-notif-pref').addEventListener('click', () => openModal('notif-pref-modal'));
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
  const u = AppState.userProfile;

  const fieldsView = document.getElementById('profile-fields-view');
  fieldsView.innerHTML = `
    <div class="form-group">
      <label>Full Name <span class="req">*</span></label>
      <input type="text" id="pf-name" class="form-control" value="${escHtml(u.fullName)}" placeholder="John Doe" />
      <p class="form-error" id="pf-name-error"></p>
    </div>
    <div class="form-group">
      <label>Email Address <span class="req">*</span></label>
      <input type="email" id="pf-email" class="form-control" value="${escHtml(u.email)}" placeholder="email@example.com" />
    </div>
    <div class="form-group">
      <label>Phone Number <span class="req">*</span></label>
      <input type="tel" id="pf-phone" class="form-control" value="${escHtml(u.phone)}" placeholder="+1 (555) 987-6543" />
      <p class="form-error" id="pf-phone-error"></p>
    </div>
    <div class="form-group">
      <label>Department</label>
      <input type="text" id="pf-dept" class="form-control" value="${escHtml(u.department)}" placeholder="IT Operations" />
    </div>
    <div class="form-group">
      <label>Location</label>
      <input type="text" id="pf-location" class="form-control" value="${escHtml(u.location)}" placeholder="San Francisco, CA" />
    </div>
  `;

  // Live validation
  document.getElementById('pf-name').addEventListener('input', function () {
    const err = validateParticipantName(this.value);
    document.getElementById('pf-name-error').textContent = err;
    this.classList.toggle('error', !!err);
  });
  document.getElementById('pf-phone').addEventListener('input', function () {
    const err = validateParticipantContact(this.value);
    document.getElementById('pf-phone-error').textContent = err;
    this.classList.toggle('error', !!err);
  });

  // Swap header buttons
  const editBtns = document.getElementById('profile-edit-btns');
  editBtns.innerHTML = `
    <button class="btn btn-green" id="save-profile-btn">${ICONS.save}<span>Save</span></button>
    <button class="btn btn-outline" id="cancel-profile-btn" style="margin-left:8px;">${ICONS.x}<span>Cancel</span></button>
  `;
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('cancel-profile-btn').addEventListener('click', () => renderProfile());
}

function saveProfile() {
  const name     = document.getElementById('pf-name').value.trim();
  const email    = document.getElementById('pf-email').value.trim();
  const phone    = document.getElementById('pf-phone').value.trim();
  const dept     = document.getElementById('pf-dept').value.trim();
  const location = document.getElementById('pf-location').value.trim();

  if (!name || !email || !phone) {
    alert('Please fill in all required fields.');
    return;
  }

  const nameErr = validateParticipantName(name);
  if (nameErr) {
    document.getElementById('pf-name-error').textContent = nameErr;
    document.getElementById('pf-name').classList.add('error');
    return;
  }

  const phoneErr = validateParticipantContact(phone);
  if (phoneErr) {
    document.getElementById('pf-phone-error').textContent = phoneErr;
    document.getElementById('pf-phone').classList.add('error');
    return;
  }

  AppState.userProfile.fullName   = name;
  AppState.userProfile.email      = email;
  AppState.userProfile.phone      = phone;
  AppState.userProfile.department = dept;
  AppState.userProfile.location   = location;
  localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));

  updateHeaderUsername();
  renderProfile();
}

function changePassword(currentPwd, newPwd, confirmPwd) {
  const errEl = document.getElementById('cp-error');
  errEl.textContent = '';

  if (!currentPwd || !newPwd || !confirmPwd) {
    errEl.textContent = 'Please fill in all fields.';
    return;
  }
  if (currentPwd !== AppState.userProfile.password) {
    errEl.textContent = '❌ Current password is incorrect.';
    return;
  }
  if (newPwd.length < 6) {
    errEl.textContent = '❌ New password must be at least 6 characters.';
    return;
  }
  const passErr = validateParticipantPassword(newPwd);
  if (passErr) {
    errEl.textContent = '❌ ' + passErr;
    return;
  }
  if (newPwd !== confirmPwd) {
    errEl.textContent = '❌ Passwords do not match.';
    return;
  }

  AppState.userProfile.password = newPwd;
  localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));

  closeModal('change-password-modal');
  alert('✅ Password updated successfully.');
}
