/* ============================================================
   UI — Modal management, sidebar, header utilities
   ============================================================ */

/* ---- Modal ---- */
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

/* ---- Sidebar ---- */
function setSidebar(open) {
  AppState.sidebarOpen = open;
  document.getElementById("sidebar").classList.toggle("open", open);
  document.getElementById("sidebar-overlay").classList.toggle("open", open);
  document
    .getElementById("main-content")
    .classList.toggle("sidebar-open", open);
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
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function handleLogout() {
  alert("Logging out...");
  window.location.href = ".././login_signup.html";
}
