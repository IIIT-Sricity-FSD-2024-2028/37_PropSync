/* ============================================================
   MAIN — Bootstrap: load shell, then bind all events
   ============================================================

   Flow:
   1. DOMContentLoaded fires
   2. loadAppShell() fetches all HTML fragments (loader.js)
   3. Once the DOM is fully assembled, bind ALL event listeners
   4. Kick off initial navigation (hash-based routing)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  loadAppShell().then(() => {

    /* ────────────────────────────────────────────────────────
       GLOBAL — Modal close (data-close attr + overlay click)
       ──────────────────────────────────────────────────────── */
    document.addEventListener('click', e => {
      const closeTarget = e.target.closest('[data-close]');
      if (closeTarget) closeModal(closeTarget.dataset.close);

      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
      }
    });

    /* ────────────────────────────────────────────────────────
       GLOBAL — Password visibility toggle
       ──────────────────────────────────────────────────────── */
    document.addEventListener('click', e => {
      const toggle = e.target.closest('.pass-toggle');
      if (!toggle) return;
      const target = document.getElementById(toggle.dataset.target);
      if (!target) return;
      const isPass = target.type === 'password';
      target.type = isPass ? 'text' : 'password';
      const eyeIcon = toggle.querySelector('.eye-icon');
      if (eyeIcon) {
        eyeIcon.innerHTML = isPass
          ? `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>`
          : `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`;
      }
    });

    /* ────────────────────────────────────────────────────────
       HEADER interactions
       ──────────────────────────────────────────────────────── */
    document.getElementById('menu-toggle').addEventListener('click', () => setSidebar(!AppState.sidebarOpen));
    document.getElementById('sidebar-overlay').addEventListener('click', () => setSidebar(false));

    document.getElementById('user-btn').addEventListener('click', () => {
      AppState.userDropdownOpen = !AppState.userDropdownOpen;
      document.getElementById('user-dropdown').classList.toggle('open', AppState.userDropdownOpen);
      document.getElementById('user-chevron').classList.toggle('rotated', AppState.userDropdownOpen);
    });

    document.getElementById('notif-bell-btn').addEventListener('click', () => navigate('notifications'));

    document.getElementById('profile-dropdown-btn').addEventListener('click', () => {
      AppState.userDropdownOpen = false;
      document.getElementById('user-dropdown').classList.remove('open');
      navigate('profile');
    });

    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('logout-dropdown-btn').addEventListener('click', handleLogout);

    // Close dropdowns when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('#user-btn') && !e.target.closest('#user-dropdown')) {
        AppState.userDropdownOpen = false;
        document.getElementById('user-dropdown')?.classList.remove('open');
        document.getElementById('user-chevron')?.classList.remove('rotated');
      }
      if (!e.target.closest('#role-filter-btn') && !e.target.closest('#role-filter-menu')) {
        document.getElementById('role-filter-menu')?.classList.remove('open');
      }
      if (!e.target.closest('#sort-btn') && !e.target.closest('#sort-menu')) {
        document.getElementById('sort-menu')?.classList.remove('open');
      }
      if (!e.target.closest('#complaints-filter-btn') && !e.target.closest('#complaints-filter-menu')) {
        document.getElementById('complaints-filter-menu')?.classList.remove('open');
      }
      if (!e.target.closest('#notif-filter-btn') && !e.target.closest('#notif-filter-menu')) {
        document.getElementById('notif-filter-menu')?.classList.remove('open');
        document.getElementById('notif-filter-chevron')?.classList.remove('rotated');
      }
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Add Participant
       ──────────────────────────────────────────────────────── */
    document.getElementById('ap-name').addEventListener('input', function () {
      const err = validateParticipantName(this.value);
      document.getElementById('ap-name-error').textContent = err;
      this.classList.toggle('error', !!err);
    });
    document.getElementById('ap-contact').addEventListener('input', function () {
      const err = validateParticipantContact(this.value);
      document.getElementById('ap-contact-error').textContent = err;
      this.classList.toggle('error', !!err);
    });
    document.getElementById('ap-password').addEventListener('input', function () {
      const err = validateParticipantPassword(this.value);
      document.getElementById('ap-password-error').textContent = err;
      this.classList.toggle('error', !!err);
    });

    document.getElementById('ap-save-btn').addEventListener('click', () => {
      const name     = document.getElementById('ap-name').value.trim();
      const email    = document.getElementById('ap-email').value.trim();
      const contact  = document.getElementById('ap-contact').value.trim();
      const password = document.getElementById('ap-password').value;
      const role     = document.getElementById('ap-role').value;

      if (!name || !email || !contact || !password) {
        alert('Please fill in all required fields');
        return;
      }
      const nameErr    = validateParticipantName(name);
      const contactErr = validateParticipantContact(contact);
      const passErr    = validateParticipantPassword(password);
      if (nameErr || contactErr || passErr) {
        alert('Please fix the validation errors before submitting');
        return;
      }

      const list = getParticipants();
      list.push({ id: generateParticipantId(list), name, email, role, status: 'Active' });
      saveParticipants(list);
      renderParticipants();
      closeModal('add-participant-modal');

      ['ap-name', 'ap-email', 'ap-contact', 'ap-password'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('ap-role').value = 'Property Owner';
      ['ap-name-error', 'ap-contact-error', 'ap-password-error'].forEach(id => document.getElementById(id).textContent = '');
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Edit Participant
       ──────────────────────────────────────────────────────── */
    document.getElementById('ep-name').addEventListener('input', function () {
      document.getElementById('ep-name-error').textContent = validateParticipantName(this.value);
    });
    document.getElementById('ep-contact').addEventListener('input', function () {
      document.getElementById('ep-contact-error').textContent = validateParticipantContact(this.value);
    });

    document.getElementById('ep-save-btn').addEventListener('click', () => {
      const id    = document.getElementById('ep-id').value;
      const name  = document.getElementById('ep-name').value.trim();
      const email = document.getElementById('ep-email').value.trim();
      const role  = document.getElementById('ep-role').value;
      if (!name || !email) { alert('Please fill in all required fields'); return; }
      const list = getParticipants().map(p => p.id === id ? { ...p, name, email, role } : p);
      saveParticipants(list);
      renderParticipants();
      closeModal('edit-participant-modal');
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Add Complaint
       ──────────────────────────────────────────────────────── */
    document.getElementById('ac-save-btn').addEventListener('click', () => {
      const title      = document.getElementById('ac-title').value.trim();
      const desc       = document.getElementById('ac-desc').value.trim();
      const provider   = document.getElementById('ac-provider').value.trim();
      const provType   = document.getElementById('ac-provider-type').value;
      const property   = document.getElementById('ac-property').value.trim();
      const reportedBy = document.getElementById('ac-reported-by').value.trim();
      const date       = document.getElementById('ac-date').value;
      const status     = document.getElementById('ac-status').value;
      const priority   = document.getElementById('ac-priority').value;
      const cost       = document.getElementById('ac-cost').value.trim();

      if (!title || !desc || !provider || !property || !reportedBy) {
        alert('Please fill in all required fields');
        return;
      }
      const list  = getComplaints();
      const newId = `CPL${String(list.length + 1).padStart(3, '0')}`;
      list.push({ id: newId, title, description: desc, serviceProvider: provider, providerType: provType, property, reportedBy, reportedDate: date, status, priority, estimatedCost: cost || undefined });
      saveComplaints(list);
      renderComplaints();
      closeModal('add-complaint-modal');
      ['ac-title', 'ac-desc', 'ac-provider', 'ac-property', 'ac-reported-by', 'ac-cost'].forEach(id => document.getElementById(id).value = '');
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Edit Complaint
       ──────────────────────────────────────────────────────── */
    document.getElementById('ec-save-btn').addEventListener('click', () => {
      const id   = document.getElementById('ec-id').value;
      const list = getComplaints().map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          title:           document.getElementById('ec-title').value,
          description:     document.getElementById('ec-desc').value,
          serviceProvider: document.getElementById('ec-provider').value,
          providerType:    document.getElementById('ec-provider-type').value,
          property:        document.getElementById('ec-property').value,
          reportedBy:      document.getElementById('ec-reported-by').value,
          reportedDate:    document.getElementById('ec-date').value,
          status:          document.getElementById('ec-status').value,
          priority:        document.getElementById('ec-priority').value,
          estimatedCost:   document.getElementById('ec-cost').value || undefined,
        };
      });
      saveComplaints(list);
      renderComplaints();
      closeModal('edit-complaint-modal');
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Change Password
       ──────────────────────────────────────────────────────── */
    document.getElementById('cp-save-btn').addEventListener('click', () => {
      changePassword(
        document.getElementById('cp-current').value,
        document.getElementById('cp-new').value,
        document.getElementById('cp-confirm').value
      );
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Update Contact
       ──────────────────────────────────────────────────────── */
    document.getElementById('ct-save-btn').addEventListener('click', () => {
      AppState.userProfile.phone = document.getElementById('ct-phone').value;
      AppState.userProfile.email = document.getElementById('ct-email').value;
      alert('Contact information updated successfully!');
      closeModal('contact-modal');
      renderProfile();
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Notification Preferences
       ──────────────────────────────────────────────────────── */
    document.getElementById('np-save-btn').addEventListener('click', () => {
      localStorage.setItem('emailNotifications', document.getElementById('np-email').checked);
      localStorage.setItem('smsNotifications',   document.getElementById('np-sms').checked);
      localStorage.setItem('pushNotifications',  document.getElementById('np-push').checked);
      localStorage.setItem('weeklyReports',      document.getElementById('np-weekly').checked);
      alert('Notification preferences updated successfully!');
      closeModal('notif-pref-modal');
    });

    /* ────────────────────────────────────────────────────────
       GLOBAL DELEGATION — Page-content action buttons
       (edit/view/delete for participants & complaints)
       ──────────────────────────────────────────────────────── */
    document.getElementById('page-content').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id     = btn.dataset.id;

      switch (action) {
        case 'edit-p':   openEditParticipantModal(id); break;
        case 'view-p':   openViewParticipantModal(id); break;
        case 'delete-p': {
          if (confirm(`Are you sure you want to delete ${btn.dataset.name}? This action cannot be undone.`)) {
            saveParticipants(getParticipants().filter(p => p.id !== id));
            renderParticipants();
          }
          break;
        }
        case 'view-c':   openViewComplaintModal(id);   break;
        case 'edit-c':   openEditComplaintModal(id);   break;
        case 'delete-c': {
          if (confirm('Are you sure you want to delete this complaint?')) {
            saveComplaints(getComplaints().filter(c => c.id !== id));
            renderComplaints();
          }
          break;
        }
        case 'review-c': openReviewEstimateModal(id); break;
      }
    });

    /* ────────────────────────────────────────────────────────
       INIT — Build sidebar, header, and navigate to first page
       ──────────────────────────────────────────────────────── */
    buildSidebar();
    updateHeaderUsername();
    updateNotifBadge();

    // Hash-based routing
    const hash       = location.hash.replace('#', '') || 'dashboard';
    const validPages = ['dashboard', 'participants', 'complaints', 'notifications', 'profile'];
    navigate(validPages.includes(hash) ? hash : 'dashboard');

    // Poll notification badge every 2 seconds
    setInterval(updateNotifBadge, 2000);

  }).catch(err => {
    // If fetch fails (e.g. opened as file:// without a server), show a helpful error
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:16px;color:#374151;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ef4444" style="width:48px;height:48px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <h2 style="font-size:20px;font-weight:700;color:#111827;">Server Required</h2>
        <p style="font-size:14px;max-width:400px;text-align:center;color:#6b7280;">
          This project uses <strong>fetch()</strong> to load HTML fragments and requires a local HTTP server.<br><br>
          Run one of these in the project folder:
        </p>
        <code style="background:#f3f4f6;padding:10px 20px;border-radius:8px;font-size:13px;">npx serve .</code>
        <span style="color:#9ca3af;font-size:13px;">or</span>
        <code style="background:#f3f4f6;padding:10px 20px;border-radius:8px;font-size:13px;">python -m http.server 8080</code>
        <p style="font-size:12px;color:#9ca3af;margin-top:8px;">Then open <strong>http://localhost:PORT</strong> in your browser.</p>
        <details style="font-size:12px;color:#ef4444;max-width:500px;"><summary>Error details</summary><pre style="margin-top:8px;">${err.message}</pre></details>
      </div>
    `;
  });
});
