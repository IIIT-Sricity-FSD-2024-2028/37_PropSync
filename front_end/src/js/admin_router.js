/* ============================================================
   ROUTER — Page navigation, sidebar builder, page renderer
   ============================================================ */

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',           iconType: 'home' },
  { id: 'participants',  label: 'Manage Participants',  iconType: 'users' },
  { id: 'complaints',    label: 'Complaints',           iconType: 'file-text' },
  { id: 'notifications', label: 'Notifications',        iconType: 'bell' },
];

function navigate(pageId) {
  AppState.currentPage = pageId;

  // Toggle page visibility
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  // Update sidebar active link
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Close sidebar on navigate
  setSidebar(false);

  // Render page content (JS-rendered pages) then re-bind page events
  renderPage(pageId);

  // Re-bind events for the newly active page's static DOM elements
  initPageEvents(pageId);

  // Update URL hash
  history.replaceState(null, '', `#${pageId}`);
}

function renderPage(pageId) {
  switch (pageId) {
    case 'dashboard':     renderDashboard();     break;
    case 'participants':  renderParticipants();  break;
    case 'complaints':    renderComplaints();    break;
    case 'notifications': renderNotifications(); break;
    case 'profile':       renderProfile();       break;
  }
}

/**
 * Re-bind all event listeners that target elements inside a specific page.
 * Called every time navigate() switches to that page, because the page
 * HTML was fetched dynamically and elements may not have existed at
 * script-parse time.
 */
function initPageEvents(pageId) {
  switch (pageId) {
    case 'participants':  initParticipantPageEvents();  break;
    case 'complaints':    initComplaintPageEvents();    break;
    case 'notifications': initNotificationPageEvents(); break;
  }
}

/* ── Participants page events ──────────────────────────── */
function initParticipantPageEvents() {
  // Search
  const pSearch = document.getElementById('p-search');
  if (pSearch && !pSearch._bound) {
    pSearch._bound = true;
    pSearch.addEventListener('input', function () {
      AppState.participantSearch = this.value;
      renderParticipants();
    });
  }

  // Role filter button
  const roleFilterBtn = document.getElementById('role-filter-btn');
  if (roleFilterBtn && !roleFilterBtn._bound) {
    roleFilterBtn._bound = true;
    roleFilterBtn.addEventListener('click', () => {
      document.getElementById('role-filter-menu').classList.toggle('open');
    });
  }

  // Role filter menu items
  const roleFilterMenu = document.getElementById('role-filter-menu');
  if (roleFilterMenu && !roleFilterMenu._bound) {
    roleFilterMenu._bound = true;
    roleFilterMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.participantRoleFilter = btn.dataset.role;
        document.getElementById('role-filter-label').textContent = btn.dataset.role;
        roleFilterMenu.classList.remove('open');
        renderParticipants();
      });
    });
  }

  // Sort dropdown button
  const sortBtn = document.getElementById('sort-btn');
  if (sortBtn && !sortBtn._bound) {
    sortBtn._bound = true;
    sortBtn.addEventListener('click', () => document.getElementById('sort-menu').classList.toggle('open'));
  }

  // Sort menu items
  const sortMenu = document.getElementById('sort-menu');
  if (sortMenu && !sortMenu._bound) {
    sortMenu._bound = true;
    sortMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        handleParticipantSort(btn.dataset.sort);
        sortMenu.classList.remove('open');
      });
    });
  }

  // Table header sort buttons
  const sortIdBtn = document.getElementById('sort-id-btn');
  if (sortIdBtn && !sortIdBtn._bound) {
    sortIdBtn._bound = true;
    sortIdBtn.addEventListener('click', () => handleParticipantSort('id'));
  }
  const sortNameBtn = document.getElementById('sort-name-btn');
  if (sortNameBtn && !sortNameBtn._bound) {
    sortNameBtn._bound = true;
    sortNameBtn.addEventListener('click', () => handleParticipantSort('name'));
  }
  const sortEmailBtn = document.getElementById('sort-email-btn');
  if (sortEmailBtn && !sortEmailBtn._bound) {
    sortEmailBtn._bound = true;
    sortEmailBtn.addEventListener('click', () => handleParticipantSort('email'));
  }

  // Add participant button
  const addBtn = document.getElementById('add-participant-btn');
  if (addBtn && !addBtn._bound) {
    addBtn._bound = true;
    addBtn.addEventListener('click', () => openModal('add-participant-modal'));
  }
}

/* ── Complaints page events ────────────────────────────── */
function initComplaintPageEvents() {
  const filterBtn = document.getElementById('complaints-filter-btn');
  if (filterBtn && !filterBtn._bound) {
    filterBtn._bound = true;
    filterBtn.addEventListener('click', () => {
      document.getElementById('complaints-filter-menu').classList.toggle('open');
    });
  }

  const searchEl = document.getElementById('complaints-search');
  if (searchEl && !searchEl._bound) {
    searchEl._bound = true;
    searchEl.addEventListener('input', function () {
      AppState.complaintsSearch = this.value;
      renderComplaints();
    });
  }

  const addBtn = document.getElementById('add-complaint-btn');
  if (addBtn && !addBtn._bound) {
    addBtn._bound = true;
    addBtn.addEventListener('click', () => {
      document.getElementById('ac-date').value = new Date().toISOString().split('T')[0];
      openModal('add-complaint-modal');
    });
  }
}

/* ── Notifications page events ─────────────────────────── */
function initNotificationPageEvents() {
  const markAllBtn = document.getElementById('mark-all-read-btn');
  if (markAllBtn && !markAllBtn._bound) {
    markAllBtn._bound = true;
    markAllBtn.addEventListener('click', () => {
      const list = getNotifications().map(n => ({ ...n, isRead: true }));
      saveNotifications(list);
      renderNotifications();
      updateNotifBadge();
    });
  }

  const clearAllBtn = document.getElementById('clear-all-notif-btn');
  if (clearAllBtn && !clearAllBtn._bound) {
    clearAllBtn._bound = true;
    clearAllBtn.addEventListener('click', () => {
      saveNotifications([]);
      renderNotifications();
      updateNotifBadge();
    });
  }

  const filterBtn = document.getElementById('notif-filter-btn');
  if (filterBtn && !filterBtn._bound) {
    filterBtn._bound = true;
    filterBtn.addEventListener('click', () => {
      document.getElementById('notif-filter-menu').classList.toggle('open');
      document.getElementById('notif-filter-chevron').classList.toggle('rotated');
    });
  }

  const filterMenu = document.getElementById('notif-filter-menu');
  if (filterMenu && !filterMenu._bound) {
    filterMenu._bound = true;
    filterMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.notifFilter = btn.dataset.filter;
        document.getElementById('notif-filter-label').textContent = btn.textContent;
        document.getElementById('notif-filter-menu').classList.remove('open');
        document.getElementById('notif-filter-chevron').classList.remove('rotated');
        filterMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderNotifications();
      });
    });
  }

  // Notification item delegation (mark read / delete)
  const listEl = document.getElementById('notifications-list');
  if (listEl && !listEl._bound) {
    listEl._bound = true;
    listEl.addEventListener('click', e => {
      const markBtn = e.target.closest('.mark-read-btn');
      if (markBtn) {
        const id   = parseInt(markBtn.dataset.notifId);
        let notifs = getNotifications();
        const n    = notifs.find(x => x.id === id);

        // If it's a new user registration notification, add that person as a participant
        if (n && n.title === 'New User Registration') {
          const nameMatch = n.description.match(/'([^']+)'/);
          const roleMatch = n.description.match(/as a ([^.]+)\./);
          if (nameMatch && roleMatch) {
            const userName     = nameMatch[1];
            const userRole     = roleMatch[1].trim();
            const participants = getParticipants();
            if (!participants.some(p => p.name === userName)) {
              participants.push({
                id:     generateParticipantId(participants),
                name:   userName,
                email:  `${userName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                role:   userRole,
                status: 'Active',
              });
              saveParticipants(participants);
            }
          }
        }

        notifs = notifs.map(x => x.id === id ? { ...x, isRead: true } : x);
        saveNotifications(notifs);
        renderNotifications();
        updateNotifBadge();
        return;
      }

      const delBtn = e.target.closest('.del-notif-btn');
      if (delBtn) {
        const id = parseInt(delBtn.dataset.delNotif);
        saveNotifications(getNotifications().filter(n => n.id !== id));
        renderNotifications();
        updateNotifBadge();
      }
    });
  }
}

/* ── Sidebar builder ───────────────────────────────────── */
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-link ${AppState.currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
      ${ICONS[item.iconType]}
      <span>${item.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-link[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
}
