/* =========================================================
   BACKEND CONFIG
   ========================================================= */
const API_BASE = "http://localhost:3000";

// For demo purposes, we assume a static user email/role for the headers
// This matches the seed data in data-store.ts (provider1@propsync.com — Plumbing)
const HEADERS = {
  "Content-Type": "application/json",
  "role": "service_provider",
  "user-email": "provider1@propsync.com"
};


/* =========================================================
   COMPLAINTS API
   ========================================================= */
async function getAllComplaints() {
  try {
    const res = await fetch(`${API_BASE}/complaints`, { headers: HEADERS });
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (err) {
    console.error("Error fetching complaints:", err);
    return [];
  }
}

async function acceptComplaint(id) {
  try {
    await fetch(`${API_BASE}/complaints/${id}/assigned`, {
      method: "PATCH",
      headers: HEADERS
    });
    await addNotification({
      type: "assignment",
      title: "Complaint Accepted",
      message: `Complaint ${id} has been added to your assigned tasks.`,
      forRole: "service_provider",
      forUser: "sai@example.com"
    });
  } catch (err) {
    console.error("Error accepting complaint", err);
  }
}

async function rejectComplaint(id) {
  try {
    await fetch(`${API_BASE}/complaints/${id}/rejected`, {
      method: "PATCH",
      headers: HEADERS
    });
  } catch (err) {
    console.error("Error rejecting complaint", err);
  }
}

/* =========================================================
   TASKS API (Using Complaints API under the hood for assigned tasks)
   ========================================================= */
async function getTasksArray() {
  try {
    // Fetch with SP role headers — backend returns Approved + assignedToMe complaints
    const res = await fetch(`${API_BASE}/complaints`, { headers: HEADERS });
    const data = await res.json();
    // Tasks = complaints assigned to this SP (not the open Approved ones)
    const tasks = data.filter(c => c.status !== 'Approved');
    // Normalize backend fields to the names the UI templates use
    return tasks.map(c => ({
      id: c.id,
      issueType: c.category,
      title: c.title,
      description: c.description,
      image: c.image || '',
      imageUrl: c.image || '',
      location: c.location,
      deadline: c.deadline || 'TBD',
      priority: c.priority,
      status: c.status,
      estimateSubmitted: c.status === 'Estimate Submitted',
      assignedTo: c.assignedTo,
      progress: {
        assigned: true,
        estimateSent: /estimate submitted|in progress|completed|payment pending/i.test(c.status),
        approved: /in progress|completed|payment pending/i.test(c.status),
        inProgress: /in progress|completed|payment pending/i.test(c.status),
        completed: /completed|payment pending/i.test(c.status),
      }
    }));
  } catch (err) {
    return [];
  }
}

async function getTask(id) {
  try {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) return null;
    const c = await res.json();
    return {
      id: c.id,
      issueType: c.category,
      title: c.title,
      description: c.description,
      image: c.image || '',
      imageUrl: c.image || '',
      location: c.location,
      deadline: c.deadline || 'TBD',
      priority: c.priority,
      status: c.status,
      assignedDate: c.reportedDate || 'TBD',
      estimateSubmitted: c.status === 'Estimate Submitted' || c.status === 'In Progress' || c.status === 'Completed',
      assignedTo: c.assignedTo,
      progress: {
        assigned: true,
        estimateSent: /estimate submitted|in progress|completed|payment pending/i.test(c.status),
        approved: /in progress|completed|payment pending/i.test(c.status),
        inProgress: /in progress|completed|payment pending/i.test(c.status),
        completed: /completed|payment pending/i.test(c.status),
      }
    };
  } catch {
    return null;
  }
}

async function updateTask(taskId, updates) {
  try {
    if (updates.status) {
      await fetch(`${API_BASE}/complaints/${taskId}/${updates.status.toLowerCase()}`, {
        method: "PATCH",
        headers: HEADERS
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitEstimate(taskId, estimate) {
  try {
    await fetch(`${API_BASE}/estimates`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        complaintId: taskId,
        providerId: "SP-2401",
        providerEmail: "sai@example.com",
        cost: estimate.cost,
        completionTime: estimate.time,
        workDescription: estimate.details
      })
    });
    await updateTask(taskId, { status: "Estimate Submitted" });
    
    await addNotification({
      title: "New Service Estimate Received",
      message: `Service provider submitted an estimate for complaint ${taskId}. Cost: ${estimate.cost}.`,
      forRole: "all",
      type: "system"
    });
  } catch (err) {
    console.error(err);
  }
}

/* =========================================================
   PROFILE API
   ========================================================= */
async function getProfile() {
  // Matches seed data: U002 - Sarah Chen, provider1@propsync.com
  return {
    name: "Sarah Chen",
    initials: "SC",
    email: "provider1@propsync.com",
    phone: "+91-9000000002",
    category: "Plumbing",
    experience: "8",
    locations: "Building A, Building B",
    spId: "U002",
  };
}


/* =========================================================
   NOTIFICATIONS API
   ========================================================= */
async function getNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { headers: HEADERS });
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return [];
  }
}

async function addNotification(data) {
  try {
    await fetch(`${API_BASE}/notifications`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error(err);
  }
}

async function markNotifRead(id) {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH", headers: HEADERS });
  } catch (err) {}
}

async function markAllNotifsRead() {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, { method: "PATCH", headers: HEADERS });
  } catch (err) {}
}

async function deleteNotification(id) {
  try {
    await fetch(`${API_BASE}/notifications/${id}`, { method: "DELETE", headers: HEADERS });
  } catch (err) {}
}

async function getUnreadCount() {
  const notifs = await getNotifications();
  return notifs.filter(n => !n.isRead).length;
}

/* =========================================================
   RATINGS + PAYMENTS API
   ========================================================= */
async function getRatings() {
  try {
    const res = await fetch(`${API_BASE}/ratings`, { headers: HEADERS });
    return await res.json();
  } catch {
    return [];
  }
}

/* =========================================================
   URL HELPERS & BADGES
   ========================================================= */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function priorityClass(p) {
  return (
    {
      High: "badge-priority-high",
      Medium: "badge-priority-medium",
      Low: "badge-priority-low",
    }[p] || "badge-gray"
  );
}

function statusClass(s) {
  return (
    {
      Assigned: "badge-status-assigned",
      "In Progress": "badge-status-in-progress",
      Completed: "badge-status-completed",
      "Estimate Submitted": "badge-status-estimate",
      "Waiting for Materials": "badge-status-waiting",
    }[s] || "badge-gray"
  );
}

function renderStars(rating, size = 14) {
  let h = '<span style="display:inline-flex;gap:2px;">';
  for (let i = 1; i <= 5; i++) {
    h += `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#F59E0B" stroke-width="1.5" ${
      i <= rating ? 'fill="#F59E0B"' : 'fill="none"'
    }/></svg>`;
  }
  return h + "</span>";
}

/* =========================================================
   SHELL - SIDEBAR + HEADER
   ========================================================= */
async function initShell(activePage) {
  const profile = await getProfile();
  const initials = profile.initials || profile.name[0].toUpperCase();
  const unread = await getUnreadCount();

  const pages = {
    dashboard: { label: "Dashboard", href: "../service_provider/index.html" },
    complaints: { label: "Available Complaints", href: "../service_provider/available-complaints.html" },
    tasks: { label: "Assigned Tasks", href: "../service_provider/assigned-tasks.html" },
    ratings: { label: "Ratings & Feedback", href: "../service_provider/ratings-feedback.html" },
    notifications: { label: "Notifications", href: "../service_provider/notifications.html" },
    profile: { label: "Profile", href: "../service_provider/profile.html" },
  };

  const navIcons = {
    dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    complaints: `<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
    tasks: `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    ratings: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    notifications: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  };

  const iconColors = {
    dashboard: "blue",
    complaints: "yellow",
    tasks: "green",
    ratings: "gold",
    notifications: "red",
    profile: "blue",
  };

  const navHTML = Object.entries(pages)
    .map(
      ([key, { label, href }]) => `
    <a href="${href}" class="nav-item ${activePage === key ? "active" : ""}">
      <span class="nav-icon ${iconColors[key]}">${navIcons[key]}</span>
      <span>${label}</span>
    </a>
  `
    )
    .join("");

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="app-shell" id="app-shell">
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
          <div class="sidebar-header">
            <img src="../../public/image.png" alt="PropSync" class="sidebar-logo"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span style="display:none;color:#fff;font-size:1.2rem;font-weight:800;letter-spacing:-0.5px;">PropSync</span>
            <button class="sidebar-close-btn" id="sidebar-close">
              <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <nav class="sidebar-nav">${navHTML}</nav>
          <div class="sidebar-divider"></div>
          <button class="sidebar-logout" id="logout-btn">
            <span class="logout-icon">-></span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div class="main-wrap">
        <header class="top-header">
          <div class="header-left">
            <button class="menu-btn" id="menu-btn">
              <svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/></svg>
            </button>
            <img src="../../public/image.png" alt="PropSync" class="header-logo"
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span style="display:none;font-size:1.1rem;font-weight:800;color:#293543;">PropSync</span>
          </div>
          <div class="header-right">
            <button class="notif-btn" onclick="location.href='../service_provider/notifications.html'" title="Notifications" style="position:relative;">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ${unread > 0 ? `<span class="notif-dot"></span>` : ""}
            </button>
            <button class="profile-btn" onclick="location.href='../service_provider/profile.html'" title="Profile">
              <span class="profile-btn-name">${profile.name || "User"}</span>
              <span class="profile-avatar">${initials}</span>
            </button>
          </div>
        </header>
        <main class="page-content" id="page-content">
  `
  );

  document.body.insertAdjacentHTML("beforeend", `</main></div></div>`);

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  document.getElementById("menu-btn").addEventListener("click", () => {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
  });

  document.getElementById("sidebar-close").addEventListener("click", closeSidebar);
  backdrop.addEventListener("click", closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
  }

  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
      location.href = "../login_signup.html";
    }
  });
}
