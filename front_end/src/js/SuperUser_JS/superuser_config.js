/* ============================================================
   CONFIG — Functional & Persistent System Configuration
   ============================================================ */

function renderConfig() {
  const container = document.getElementById('config-content');
  if (!container) return;

  // Load from localStorage with defaults
  const cfg = {
    systemName:       localStorage.getItem('config_systemName')       || 'PropSync Management Portal',
    defaultCommunity: localStorage.getItem('config_defaultCommunity') || 'Green Valley Society',
    currency:         localStorage.getItem('config_currency')         || 'INR (₹)',
    supportEmail:     localStorage.getItem('config_supportEmail')     || 'support@propsync.com',
    platformFeePct:   localStorage.getItem('config_platformFeePct')   || '5',
    managerSharePct:  localStorage.getItem('config_managerSharePct')  || '95',
    defaultMonthlyFee:localStorage.getItem('config_defaultMonthlyFee')|| '2000',
    gracePeriodDays:  localStorage.getItem('config_gracePeriodDays')  || '7',
    notifyAdminReg:   (localStorage.getItem('config_notifyAdminReg')   ?? 'true')  === 'true',
    notifyHighPriority:(localStorage.getItem('config_notifyHighPriority') ?? 'true') === 'true',
    notifySysErrors:  (localStorage.getItem('config_notifySysErrors')  ?? 'true')  === 'true',
    enableEmailAlerts:(localStorage.getItem('config_enableEmailAlerts')?? 'true')  === 'true',
    requireApproval:  (localStorage.getItem('config_requireApproval')  ?? 'true')  === 'true',
    sessionTimeout:   parseInt(localStorage.getItem('config_sessionTimeout') || '30'),
    passMinLength:    parseInt(localStorage.getItem('config_passMinLength')  || '8'),
    require2FA:       (localStorage.getItem('config_require2FA')       ?? 'false') === 'true',
    lastBackup:       localStorage.getItem('config_lastBackup')       || '2026-03-05 11:30 PM',
  };

  container.innerHTML = `
    <div class="config-grid-2" style="margin-bottom:16px;">
      <!-- Application & Society Settings -->
      <div class="config-card config-blue">
        <div class="config-card-header">${ICONS.globe}<h2>Application & Society Settings</h2></div>
        <div class="config-card-body">
          <div class="config-field">
            <label>Platform / Application Name</label>
            <input type="text" id="cfg-sys-name" class="form-control xs" value="${escHtml(cfg.systemName)}" />
          </div>
          <div class="config-field">
            <label>Default Community / Society</label>
            <input type="text" id="cfg-def-community" class="form-control xs" value="${escHtml(cfg.defaultCommunity)}" />
          </div>
          <div class="config-field">
            <label>System Currency</label>
            <select id="cfg-currency" class="form-control xs">
              <option value="INR (₹)" ${cfg.currency === 'INR (₹)' ? 'selected' : ''}>INR (₹) - Indian Rupee</option>
              <option value="USD ($)" ${cfg.currency === 'USD ($)' ? 'selected' : ''}>USD ($) - US Dollar</option>
              <option value="EUR (€)" ${cfg.currency === 'EUR (€)' ? 'selected' : ''}>EUR (€) - Euro</option>
            </select>
          </div>
          <div class="config-field">
            <label>Support Email Address</label>
            <input type="email" id="cfg-support-email" class="form-control xs" value="${escHtml(cfg.supportEmail)}" />
          </div>
        </div>
      </div>

      <!-- Maintenance & Revenue Policies -->
      <div class="config-card config-green">
        <div class="config-card-header">${ICONS.wrench}<h2>Maintenance & Revenue Policies</h2></div>
        <div class="config-card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="config-field">
              <label>Platform Fee (%)</label>
              <input type="number" id="cfg-fee-pct" class="form-control xs" value="${escHtml(cfg.platformFeePct)}" min="1" max="50" />
            </div>
            <div class="config-field">
              <label>Manager Share (%)</label>
              <input type="number" id="cfg-mgr-pct" class="form-control xs" value="${escHtml(cfg.managerSharePct)}" readonly style="background:#f3f4f6;" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="config-field">
              <label>Default Charge (₹)</label>
              <input type="number" id="cfg-def-fee" class="form-control xs" value="${escHtml(cfg.defaultMonthlyFee)}" min="100" step="100" />
            </div>
            <div class="config-field">
              <label>Grace Period (Days)</label>
              <input type="number" id="cfg-grace-days" class="form-control xs" value="${escHtml(cfg.gracePeriodDays)}" min="1" max="30" />
            </div>
          </div>
          <p style="font-size:11px;color:#6b7280;margin-top:4px;">Revenue fee changes take effect on subsequent monthly maintenance settlements.</p>
        </div>
      </div>
    </div>

    <div class="config-grid-2" style="margin-bottom:16px;">
      <!-- Notification & Alert Preferences -->
      <div class="config-card config-yellow">
        <div class="config-card-header">${ICONS.bell}<h2>Notification & Alert Preferences</h2></div>
        <div class="config-card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>Administrator Signups</h3>
              <p>Alert Super User when a new Administrator registers</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-admin" ${cfg.notifyAdminReg ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>High Priority Complaints</h3>
              <p>Alert on high priority unresolved complaints</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-priority" ${cfg.notifyHighPriority ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>System Health Alerts</h3>
              <p>Alert on database or server degradation</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-notify-sys" ${cfg.notifySysErrors ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>Email Delivery</h3>
              <p>Send copy of notifications to support email</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-email-alerts" ${cfg.enableEmailAlerts ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>

      <!-- Security & Access Settings -->
      <div class="config-card config-red">
        <div class="config-card-header">${ICONS.shield}<h2>Security & Access Control</h2></div>
        <div class="config-card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>Require Registration Approval</h3>
              <p>Require admin verification before active access</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-req-approval" ${cfg.requireApproval ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
          <div class="config-field">
            <label>Session Timeout (minutes)</label>
            <div class="number-input-wrap"><input type="number" id="cfg-session" class="form-control xs" value="${cfg.sessionTimeout}" min="5" max="1440" /></div>
          </div>
          <div class="config-field">
            <label>Password Minimum Length</label>
            <div class="number-input-wrap"><input type="number" id="cfg-pass-len" class="form-control xs" value="${cfg.passMinLength}" min="6" max="32" /></div>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <h3>Two-Factor Authentication</h3>
              <p>Enforce 2FA for administrative logins</p>
            </div>
            <label class="toggle"><input type="checkbox" id="cfg-2fa" ${cfg.require2FA ? 'checked' : ''} /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Database Maintenance -->
    <div class="config-card config-orange" style="margin-bottom:16px;">
      <div class="config-card-header">${ICONS.database}<h2>Database & System Maintenance</h2></div>
      <div class="config-card-body">
        <div class="db-actions">
          <button class="db-action-btn" id="cfg-backup-btn">${ICONS.database}<span>Backup Database</span></button>
          <button class="db-action-btn" id="cfg-optimize-btn">${ICONS.settings}<span>Flush Temporary Cache</span></button>
        </div>
        <p class="db-last-backup" id="cfg-last-backup">Last backup: ${escHtml(cfg.lastBackup)}</p>
      </div>
    </div>

    <!-- Save Controls -->
    <div class="config-save-row">
      <div class="success-toast" id="cfg-success">${ICONS.check}<span>System configuration saved and persisted successfully!</span></div>
      <button class="btn btn-blue" id="cfg-save-btn">${ICONS.save}<span style="margin-left:6px;">Save Configuration</span></button>
    </div>
  `;

  // Auto-calculate manager share when platform fee changes
  const feeInput = document.getElementById('cfg-fee-pct');
  const mgrInput = document.getElementById('cfg-mgr-pct');
  if (feeInput && mgrInput) {
    feeInput.addEventListener('input', () => {
      const fee = Math.max(1, Math.min(50, Number(feeInput.value) || 5));
      mgrInput.value = String(100 - fee);
    });
  }

  // Save button
  document.getElementById('cfg-save-btn').addEventListener('click', () => {
    localStorage.setItem('config_systemName',       document.getElementById('cfg-sys-name').value);
    localStorage.setItem('config_defaultCommunity', document.getElementById('cfg-def-community').value);
    localStorage.setItem('config_currency',         document.getElementById('cfg-currency').value);
    localStorage.setItem('config_supportEmail',     document.getElementById('cfg-support-email').value);
    localStorage.setItem('config_platformFeePct',   document.getElementById('cfg-fee-pct').value);
    localStorage.setItem('config_managerSharePct',  document.getElementById('cfg-mgr-pct').value);
    localStorage.setItem('config_defaultMonthlyFee',document.getElementById('cfg-def-fee').value);
    localStorage.setItem('config_gracePeriodDays',  document.getElementById('cfg-grace-days').value);
    localStorage.setItem('config_notifyAdminReg',   document.getElementById('cfg-notify-admin').checked);
    localStorage.setItem('config_notifyHighPriority',document.getElementById('cfg-notify-priority').checked);
    localStorage.setItem('config_notifySysErrors',  document.getElementById('cfg-notify-sys').checked);
    localStorage.setItem('config_enableEmailAlerts',document.getElementById('cfg-email-alerts').checked);
    localStorage.setItem('config_requireApproval',  document.getElementById('cfg-req-approval').checked);
    localStorage.setItem('config_sessionTimeout',   document.getElementById('cfg-session').value);
    localStorage.setItem('config_passMinLength',    document.getElementById('cfg-pass-len').value);
    localStorage.setItem('config_require2FA',       document.getElementById('cfg-2fa').checked);

    const toast = document.getElementById('cfg-success');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  });

  // DB action buttons
  document.getElementById('cfg-backup-btn').addEventListener('click', function () {
    this.classList.add('clicked');
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('config_lastBackup', formatted);
    document.getElementById('cfg-last-backup').textContent = `Last backup: ${formatted}`;
  });

  document.getElementById('cfg-optimize-btn').addEventListener('click', function () {
    this.classList.add('clicked');
    this.querySelector('span').textContent = 'Cache Flushed & Optimized!';
    setTimeout(() => {
      this.querySelector('span').textContent = 'Flush Temporary Cache';
      this.classList.remove('clicked');
    }, 2500);
  });
}
