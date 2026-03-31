/* ============================================================
   NOTIFICATIONS — Render and actions
   ============================================================ */

function notifTypeColors(type) {
  switch (type) {
    case 'success': return { bg: '#dcfce7', text: '#16a34a', borderClass: 'unread-success' };
    case 'warning': return { bg: '#ffedd5', text: '#ea580c', borderClass: 'unread-warning' };
    case 'error':   return { bg: '#fee2e2', text: '#dc2626', borderClass: 'unread-error' };
    default:        return { bg: '#dbeafe', text: '#2563eb', borderClass: 'unread-info' };
  }
}

function renderNotifications() {
  let notifs     = getNotifications();
  const filter   = AppState.notifFilter;

  if (filter === 'unread') notifs = notifs.filter(n => !n.isRead);
  else if (filter === 'read') notifs = notifs.filter(n => n.isRead);

  // Update unread pill
  const unread = getNotifications().filter(n => !n.isRead).length;
  const pill   = document.getElementById('notif-unread-pill');
  if (pill) {
    if (unread > 0) {
      pill.textContent = `${unread} Unread`;
      pill.classList.remove('hidden');
    } else {
      pill.classList.add('hidden');
    }
  }

  const listEl = document.getElementById('notifications-list');
  if (!listEl) return;

  if (notifs.length === 0) {
    listEl.innerHTML = `
      <div class="card" style="padding:48px;text-align:center;">
        <span style="display:flex;justify-content:center;margin-bottom:12px;color:#d1d5db;">${ICONS.bell}</span>
        <p style="font-weight:500;color:#4b5563;">No notifications</p>
        <p style="font-size:14px;color:#9ca3af;margin-top:4px;">
          ${filter === 'unread' ? "You have no unread notifications" : filter === 'read' ? "You have no read notifications" : "You're all caught up!"}
        </p>
      </div>`;
    return;
  }

  listEl.innerHTML = notifs.map(n => {
    const colors = notifTypeColors(n.type);
    return `
      <div class="notification-item ${!n.isRead ? colors.borderClass : ''}">
        <div class="notif-item-inner">
          <div class="notif-icon-box" style="background:${colors.bg};color:${colors.text};">
            ${ICONS[n.iconType] || ICONS['user-plus']}
          </div>
          <div class="notif-content">
            <div class="notif-title-row">
              <div>
                <span class="notif-title">${escHtml(n.title)}</span>
                ${n.isNew ? '<span class="new-pill">New</span>' : ''}
              </div>
              <div class="notif-time">${ICONS.clock}<span>${n.timestamp}</span></div>
            </div>
            <span class="notif-category">${escHtml(n.category)}</span>
            <p class="notif-desc">${escHtml(n.description)}</p>
            <div class="notif-item-actions">
              ${!n.isRead ? `<button class="mark-read-btn" data-notif-id="${n.id}">${ICONS.check}Mark as Read</button>` : ''}
              <button class="del-notif-btn" data-del-notif="${n.id}">${ICONS.trash}Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateNotifBadge();
}
