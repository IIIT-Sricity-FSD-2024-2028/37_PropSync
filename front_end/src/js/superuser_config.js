/* ============================================================
   CONFIG — System Configuration page render
   ============================================================ */

function renderConfig() {
  const container = document.getElementById('config-content');
  if (!container) return;

  // Load from localStorage with defaults
  const cfg = {
    systemName:  localStorage.getItem('config_systemName')  || 'Property Maintenance & Service Coordination System',
    timezone:    localStorage.getItem('config_timezone')    || 'UTC (GMT+0)',
    language:    localStorage.getItem('config_language')    || 'English',
    smtpServer:  localStorage.getItem('config_smtpServer')  || 'smtp.example.com',
    fromEmail:   localStorage.getItem('config_fromEmail')   || 'noreply@system.com',
    emailNotif:   (localStorage.getItem('config_enableEmailNotifications') ?? 'true') === 'true',
    notifyNew:    (localStorage.getItem('config_notifyNewUsers')    ?? 'true')  === 'true',
    notifySys:    (localStorage.getItem('config_notifySystemErrors') ?? 'true')  === 'true',
    notifyComp:   (localStorage.getItem('config_notifyComplaints')  ?? 'true')  === 'true',
    notifyDaily:  (localStorage.getItem('config_notifyDailyReports') ?? 'false') === 'true',
    sessionTimeout:    parseInt(localStorage.getItem('config_sessionTimeout')    || '30'),
    passwordMinLength: parseInt(localStorage.getItem('config_passwordMinLength') || '8'),
    require2FA:  (localStorage.getItem('config_requireTwoFactor') ?? 'true') === 'true',
    lastBackup: '2026-03-05 11:30 PM',
  };

  container.innerHTML = `
    <div class="config-grid-2">
      <!-- General Settings -->
      <div class="config-card config-blue">
        <div class="config-card-header">${ICONS.globe}<h2>General Settings</h2></div>
        <div class="config-card-body">
          <div class="config-field"><label>System Name</label>
            <input type="text" id="cfg-sys-name" class="form-control xs" value="${escHtml(cfg.systemName)}" /></div>
          <div class="config-field"><label>Default Timezone</label>
            <input type="text" id="cfg-timezone" class="form-control xs" value="${escHtml(cfg.timezone)}" /></div>
          <div class="config-field"><label>Language</label>
            <input type="text" id="cfg-language" class="form-control xs" value="${escHtml(cfg.language)}" /></div>
        </div>
      </div>

      <!-- Email Settings -->
      <div class="config-card config-green">
        <div class="config-card-header">${ICONS.mail}<h2>Email Settings</h2></div>
        <div class="config-card-body">
          <div class="config-field"><label>SMTP Server</label>
            <input type="text" id="cfg-smtp" class="form-control xs" value="${escHtml(cfg.smtpServer)}" /></div>
          <div class="config-field"><label>From Email</label>
            <input type="email" id="cfg-from-email" class="form-control xs" value="${escHtml(cfg.fromEmail)}" /></div>
          <div class="checkbox-row">
            <input type="checkbox" id="cfg-email-notif" ${cfg.emailNotif ? 'checked' : ''} />
            <label for="cfg-email-notif">Enable Email Notifications</label>
          </div>
        </div>
      </div>
    </div>

    <div class="config-grid-3">
      <!-- Notification Preferences -->
      <div class="config-card config-yellow">
        <div class="config-card-header">${ICONS.bell}<h2>Notification Preferences</h2></div>
        <div class="config-card-body">
          <div class="toggle-row">
            <div class="toggle-label"><h3>New User Registration</h3><p>Notify on new registrations</p></div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-new" ${cfg.notifyNew ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label"><h3>System Errors</h3><p>Alert on system issues</p></div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-sys" ${cfg.notifySys ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label"><h3>Complaints</h3><p>Notify on new complaints</p></div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-comp" ${cfg.notifyComp ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label"><h3>Daily Reports</h3><p>Receive daily summaries</p></div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-daily" ${cfg.notifyDaily ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="config-card config-red">
        <div class="config-card-header">${ICONS.shield}<h2>Security Settings</h2></div>
        <div class="config-card-body">
          <div class="config-field">
            <label>Session Timeout (minutes)</label>
            <div class="number-input-wrap"><input type="number" id="cfg-session" class="form-control xs" value="${cfg.sessionTimeout}" min="1" max="1440" /></div>
          </div>
          <div class="config-field">
            <label>Password Min. Length</label>
            <div class="number-input-wrap"><input type="number" id="cfg-pass-len" class="form-control xs" value="${cfg.passwordMinLength}" min="4" max="32" /></div>
          </div>
          <div class="toggle-row">
            <div class="toggle-label"><h3>Two-Factor Auth</h3><p>Require 2FA for all users</p></div>
            <label class="toggle"><input type="checkbox" id="cfg-2fa" ${cfg.require2FA ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Database Maintenance -->
    <div class="config-card config-orange" style="margin-top:12px;">
      <div class="config-card-header">${ICONS.database}<h2>Database Maintenance</h2></div>
      <div class="config-card-body">
        <div class="db-actions">
          <button class="db-action-btn" id="cfg-backup-btn">${ICONS.database}<span>Backup Database</span></button>
          <button class="db-action-btn" id="cfg-optimize-btn">${ICONS.settings}<span>Optimize Database</span></button>
        </div>
        <p class="db-last-backup" id="cfg-last-backup">Last backup: ${cfg.lastBackup}</p>
      </div>
    </div>

    <!-- Save -->
    <div class="config-save-row">
      <div class="success-toast" id="cfg-success">${ICONS.check}<span>Settings saved successfully!</span></div>
      <button class="btn btn-blue" id="cfg-save-btn">${ICONS.save}<span style="margin-left:6px;">Save Changes</span></button>
    </div>
  `;

  // Save button
  document.getElementById('cfg-save-btn').addEventListener('click', () => {
    localStorage.setItem('config_systemName',               document.getElementById('cfg-sys-name').value);
    localStorage.setItem('config_timezone',                 document.getElementById('cfg-timezone').value);
    localStorage.setItem('config_language',                 document.getElementById('cfg-language').value);
    localStorage.setItem('config_smtpServer',               document.getElementById('cfg-smtp').value);
    localStorage.setItem('config_fromEmail',                document.getElementById('cfg-from-email').value);
    localStorage.setItem('config_enableEmailNotifications', document.getElementById('cfg-email-notif').checked);
    localStorage.setItem('config_notifyNewUsers',           document.getElementById('cfg-notify-new').checked);
    localStorage.setItem('config_notifySystemErrors',       document.getElementById('cfg-notify-sys').checked);
    localStorage.setItem('config_notifyComplaints',         document.getElementById('cfg-notify-comp').checked);
    localStorage.setItem('config_notifyDailyReports',       document.getElementById('cfg-notify-daily').checked);
    localStorage.setItem('config_sessionTimeout',           document.getElementById('cfg-session').value);
    localStorage.setItem('config_passwordMinLength',        document.getElementById('cfg-pass-len').value);
    localStorage.setItem('config_requireTwoFactor',         document.getElementById('cfg-2fa').checked);
    const toast = document.getElementById('cfg-success');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  });

  // DB action buttons
  document.getElementById('cfg-backup-btn').addEventListener('click', function () {
    this.classList.add('clicked');
    const now = new Date();
    document.getElementById('cfg-last-backup').textContent = `Last backup: ${now.toLocaleString()}`;
  });

  document.getElementById('cfg-optimize-btn').addEventListener('click', function () {
    this.classList.add('clicked');
    this.querySelector('span').textContent = 'Optimized!';
  });
}
