/* ============================================================
   MAIN — Bootstrap: load shell, then bind all events safely
   ============================================================ */

function safeOn(elementOrId, event, handler) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (el) {
    el.addEventListener(event, handler);
  }
}

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
    safeOn('menu-toggle', 'click', () => setSidebar(!AppState.sidebarOpen));
    safeOn('sidebar-overlay', 'click', () => setSidebar(false));
    safeOn('sidebar-close', 'click', () => setSidebar(false));

    safeOn('user-btn', 'click', () => {
      AppState.userDropdownOpen = !AppState.userDropdownOpen;
      const dd = document.getElementById('user-dropdown');
      const ch = document.getElementById('user-chevron');
      if (dd) dd.classList.toggle('open', AppState.userDropdownOpen);
      if (ch) ch.classList.toggle('rotated', AppState.userDropdownOpen);
    });

    safeOn('notif-bell-btn', 'click', () => navigate('notifications'));

    safeOn('profile-dropdown-btn', 'click', () => {
      AppState.userDropdownOpen = false;
      const dd = document.getElementById('user-dropdown');
      if (dd) dd.classList.remove('open');
      navigate('profile');
    });

    safeOn('logout-btn', 'click', handleLogout);
    safeOn('logout-dropdown-btn', 'click', handleLogout);

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
    safeOn('ap-name', 'input', function () {
      const err = validateParticipantName(this.value);
      const errEl = document.getElementById('ap-name-error');
      if (errEl) errEl.textContent = err;
      this.classList.toggle('error', !!err);
    });
    safeOn('ap-contact', 'input', function () {
      const err = validateParticipantContact(this.value);
      const errEl = document.getElementById('ap-contact-error');
      if (errEl) errEl.textContent = err;
      this.classList.toggle('error', !!err);
    });
    safeOn('ap-password', 'input', function () {
      const err = validateParticipantPassword(this.value);
      const errEl = document.getElementById('ap-password-error');
      if (errEl) errEl.textContent = err;
      this.classList.toggle('error', !!err);
    });

    safeOn('ap-save-btn', 'click', () => {
      const nameEl = document.getElementById('ap-name');
      const emailEl = document.getElementById('ap-email');
      const contactEl = document.getElementById('ap-contact');
      const passEl = document.getElementById('ap-password');
      const roleEl = document.getElementById('ap-role');

      if (!nameEl || !emailEl || !contactEl || !passEl) return;

      const name     = nameEl.value.trim();
      const email    = emailEl.value.trim();
      const contact  = contactEl.value.trim();
      const password = passEl.value;
      const role     = roleEl ? roleEl.value : 'Property Owner';

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

      ['ap-name', 'ap-email', 'ap-contact', 'ap-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      if (roleEl) roleEl.value = 'Property Owner';
      ['ap-name-error', 'ap-contact-error', 'ap-password-error'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
      });
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Edit Participant
       ──────────────────────────────────────────────────────── */
    safeOn('ep-name', 'input', function () {
      const errEl = document.getElementById('ep-name-error');
      if (errEl) errEl.textContent = validateParticipantName(this.value);
    });
    safeOn('ep-contact', 'input', function () {
      const errEl = document.getElementById('ep-contact-error');
      if (errEl) errEl.textContent = validateParticipantContact(this.value);
    });

    safeOn('ep-save-btn', 'click', () => {
      const idEl = document.getElementById('ep-id');
      const nameEl = document.getElementById('ep-name');
      const emailEl = document.getElementById('ep-email');
      const roleEl = document.getElementById('ep-role');

      if (!idEl || !nameEl || !emailEl) return;

      const id    = idEl.value;
      const name  = nameEl.value.trim();
      const email = emailEl.value.trim();
      const role  = roleEl ? roleEl.value : 'Property Owner';
      if (!name || !email) { alert('Please fill in all required fields'); return; }
      const list = getParticipants().map(p => p.id === id ? { ...p, name, email, role } : p);
      saveParticipants(list);
      renderParticipants();
      closeModal('edit-participant-modal');
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Change Password
       ──────────────────────────────────────────────────────── */
    safeOn('cp-save-btn', 'click', () => {
      const curEl = document.getElementById('cp-current');
      const newEl = document.getElementById('cp-new');
      const confEl = document.getElementById('cp-confirm');
      changePassword(
        curEl ? curEl.value : '',
        newEl ? newEl.value : '',
        confEl ? confEl.value : ''
      );
    });

    /* ────────────────────────────────────────────────────────
       MODAL — Update Contact
       ──────────────────────────────────────────────────────── */
    safeOn('ct-save-btn', 'click', () => {
      const phoneEl = document.getElementById('ct-phone');
      const emailEl = document.getElementById('ct-email');
      if (phoneEl) AppState.userProfile.phone = phoneEl.value;
      if (emailEl) AppState.userProfile.email = emailEl.value;
      alert('Contact information updated successfully!');
      closeModal('contact-modal');
      renderProfile();
    });

    /* ────────────────────────────────────────────────────────
       GLOBAL DELEGATION — Page-content action buttons
       (view/delete for participants & complaints)
       ──────────────────────────────────────────────────────── */
    const pageContentEl = document.getElementById('page-content');
    if (pageContentEl) {
      pageContentEl.addEventListener('click', e => {
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
        }
      });
    }

    /* ────────────────────────────────────────────────────────
       INIT — Build sidebar, header, and navigate to first page
       ──────────────────────────────────────────────────────── */
    buildSidebar();
    updateHeaderUsername();

    const refreshAdminNotifications = async () => {
      await refreshBackendNotifications();
      updateNotifBadge();
      if (AppState.currentPage === 'notifications') renderNotifications(true);
    };
    refreshAdminNotifications();

    // Hash-based routing
    const hash       = location.hash.replace('#', '') || 'dashboard';
    const validPages = ['dashboard', 'participants', 'complaints', 'notifications', 'profile'];
    navigate(validPages.includes(hash) ? hash : 'dashboard');

    // Poll notification badge every 2 seconds
    setInterval(updateNotifBadge, 2000);

  }).catch(err => {
    console.error('Administrator AppShell Initialization Error:', err);
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:16px;color:#374151;">
          <h2 style="font-size:20px;font-weight:700;color:#111827;">Administrator Interface Error</h2>
          <p style="font-size:14px;max-width:400px;text-align:center;color:#6b7280;">An error occurred while initializing the Administrator view.</p>
          <details style="font-size:12px;color:#ef4444;max-width:500px;"><summary>Error details</summary><pre style="margin-top:8px;">${err.message}</pre></details>
        </div>
      `;
    }
  });
});
