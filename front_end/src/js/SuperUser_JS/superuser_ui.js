/* ============================================================
   UI — Modal management, sidebar, header utilities
   ============================================================ */

/* ---- Modal ---- */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

/* ---- Sidebar ---- */
function setSidebar(open) {
  AppState.sidebarOpen = open;
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const main = document.getElementById("main-content");
  if (sidebar) sidebar.classList.toggle("open", open);
  if (overlay) overlay.classList.toggle("open", open);
  if (main) main.classList.toggle("sidebar-open", open);
}

/* ---- Header ---- */
function updateHeaderUsername() {
  const fullName = AppState.userProfile.fullName || "Super User";
  const username = document.getElementById("header-username");
  if (username) username.textContent = fullName;

  const avatar = document.querySelector(".user-avatar");
  if (avatar) {
    avatar.textContent = fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
    avatar.title = fullName;
  }
}

function updateNotifBadge() {
  const notifs = getNotifications();
  const count = notifs.filter((n) => !n.isRead).length;
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  window.location.href = ".././login_signup.html";
}
