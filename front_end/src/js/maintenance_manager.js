/* PropSync app.js – unified shared JS */

/* ============================================================
   COMPLAINTS
   ============================================================ */
let complaintsData = [];

const PS_OWNER_DIRECTORY = {
  1: { name: "Raj Kumar", email: "raj.owner@propsync.com", unit: "A-101" },
  2: { name: "Anita Sharma", email: "anita.owner@propsync.com", unit: "B-202" },
  3: { name: "Karan Mehta", email: "karan.owner@propsync.com", unit: "C-303" },
  4: { name: "Priya Nair", email: "priya.owner@propsync.com", unit: "D-404" },
};

function getOwnerDisplay(ownerId) {
  const owner = PS_OWNER_DIRECTORY[Number(ownerId)];
  if (!owner) return { name: `Owner #${ownerId || "-"}`, email: "", unit: "-" };
  return owner;
}

function getMaintenanceManagerIdentity() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || {};
  } catch {
    return {};
  }
}

function getMaintenanceManagerProfile(user) {
  if (!user.email) return null;
  try {
    return JSON.parse(localStorage.getItem(`mmProfile:${user.email}`)) || null;
  } catch {
    return null;
  }
}

function updateMaintenanceManagerIdentityChrome() {
  const user = getMaintenanceManagerIdentity();
  const profile = getMaintenanceManagerProfile(user) || {};
  const fullName = profile.name || user.name || "Maintenance Manager";
  const community =
    profile.community || user.communityName || "Green Valley Society";
  const block = profile.block || user.block;

  document.querySelectorAll(".topbar-right span, .user-role").forEach((el) => {
    if (/Maintenance Manager/i.test(el.textContent)) {
      el.textContent = fullName;
      el.title = block
        ? `${fullName} - Block ${block} Maintenance Manager`
        : `${fullName} · Maintenance Manager`;
    }
  });

  const welcomeTitle = document.querySelector(".welcome-banner h1");
  if (welcomeTitle) welcomeTitle.textContent = `Welcome Back, ${fullName}`;

  const welcomeSub = document.querySelector(".welcome-banner p");
  if (welcomeSub) {
    welcomeSub.textContent = block
      ? `Manage Block ${block} maintenance for ${community}`
      : `Manage ${community} maintenance and service coordination efficiently`;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  updateMaintenanceManagerIdentityChrome,
);

async function fetchComplaintsFromBackend() {
  try {
    const currentManager = getMaintenanceManagerIdentity();
    const managerId = currentManager.id || 5;
    const res = await fetch(
      `http://localhost:3000/complaints?managerId=${managerId}`,
      { headers: { role: "maintenance_manager" } },
    );
    if (res.ok) {
      const data = await res.json();
      const STATUS_LABEL = {
        pending: "Pending",
        approved: "Approved",
        assigned: "Assigned",
        estimating_cost: "Estimating Cost",
        in_progress: "In Progress",
        completed: "Completed",
        billed: "Billed",
        paid: "Paid",
        closed: "Closed",
        rejected: "Rejected",
      };
      const PRIORITY_LABEL = {
        low: "Low",
        medium: "Medium",
        high: "High",
      };

      // map backend data to frontend format expected by maintenance manager
      complaintsData = data.map((c) => {
        const owner = getOwnerDisplay(c.ownerId);
        return {
          id: c.id,
          issue: c.title,
          description: c.description || "",
          photo: c.photo || "",
          location: c.location || "Property",
          priority:
            PRIORITY_LABEL[String(c.priority || "").toLowerCase()] ||
            c.priority ||
            "Medium",
          status: STATUS_LABEL[c.status] || c.status,
          // subStatus drives the action shown in the Approved tab.
          subStatus:
            c.status === "approved" &&
            c.interestedProviders &&
            c.interestedProviders.length > 0
              ? "Waiting Provider Response"
              : "",
          interestedProviders: c.interestedProviders || [],
          submitted: c.submittedAt ? c.submittedAt.split("T")[0] : "2024-03-01",
          deadline: c.deadline || "",
          provider: c.assignedProviderId
            ? "Provider " + c.assignedProviderId
            : "",
          ownerId: c.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          ownerUnit: owner.unit,
          submittedBy: `${owner.name} (${owner.unit})`,
          rejectionReason: c.rejectionReason || "",
        };
      });

      // Update global complaints array which some code might still use directly
      complaints = complaintsData;

      // Trigger re-renders
      if (typeof renderTable === "function") renderTable();
      if (typeof renderPendingComplaints === "function")
        renderPendingComplaints();
      if (typeof renderDashboardComplaints === "function")
        renderDashboardComplaints();
      if (typeof renderKPIs === "function") renderKPIs();
      if (typeof renderDashNotifs === "function") renderDashNotifs();
      if (typeof updateNotifDot === "function") updateNotifDot();
    }
  } catch (e) {
    console.error("Error fetching complaints", e);
  }
}

fetchComplaintsFromBackend();
setInterval(fetchComplaintsFromBackend, 15000);

function getComplaints() {
  return complaintsData;
}

let complaints = [];

function saveComplaints(data) {
  // Not used directly for persistence anymore, replaced by API calls
}

async function approveComplaintById(id) {
  const deadline = requestApprovalDeadline(id);
  if (!deadline) return false;

  try {
    const res = await fetch(`http://localhost:3000/complaints/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        role: "maintenance_manager",
      },
      body: JSON.stringify({ status: "approved", deadline }),
    });
    if (res.ok) {
      addNotification(
        "checkmark",
        "#DCFCE7",
        "Complaint Approved",
        `Complaint ${id} approved`,
        "all",
        false,
      );
      fetchComplaintsFromBackend();
      return true;
    }
    const errorBody = await res.json().catch(() => ({}));
    alert(errorBody.message || "Could not approve complaint.");
  } catch (e) {
    console.error(e);
    alert("Network error approving complaint.");
  }
  return false;
}

function requestApprovalDeadline(id) {
  const today = new Date().toISOString().split("T")[0];
  const deadline = prompt(
    `Set deadline for complaint ${id} before approving (YYYY-MM-DD):`,
    today,
  );
  if (!deadline) return null;
  const trimmed = deadline.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    alert("Please enter the deadline in YYYY-MM-DD format.");
    return null;
  }
  return trimmed;
}

async function rejectComplaintById(id, reason) {
  try {
    const res = await fetch(`http://localhost:3000/complaints/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        role: "maintenance_manager",
      },
      body: JSON.stringify({ status: "rejected", rejectionReason: reason }),
    });
    if (res.ok) {
      addNotification(
        "cross",
        "#FEE2E2",
        "Complaint Rejected",
        `Complaint ${id} rejected`,
        "all",
        false,
      );
      fetchComplaintsFromBackend();
    }
  } catch (e) {
    console.error(e);
  }
}

/* ============================================================
   PROVIDERS
   ============================================================ */
let providers = [];

async function fetchProvidersFromBackend() {
  try {
    const res = await fetch(
      "http://localhost:3000/users?role=service_provider",
      { headers: { role: "maintenance_manager" } },
    );
    if (res.ok) {
      const data = await res.json();
      providers = data.map((u) => ({
        id: u.id,
        name: u.name,
        specialty: u.category || "General",
        rating: (4.0 + Math.random()).toFixed(1),
        jobs: Math.floor(Math.random() * 100) + 10,
        onTime: 80 + Math.floor(Math.random() * 20),
        avgCost: 1000 + Math.floor(Math.random() * 3000),
        trend: Math.random() > 0.5 ? "up" : "down",
      }));
      if (typeof renderPerformance === "function") renderPerformance();
    }
  } catch (e) {
    console.error("Error fetching providers", e);
  }
}
fetchProvidersFromBackend();

const providerReviews = {
  "Urban Lift Repairs": [
    {
      author: "Rajesh Kumar",
      date: "2024-03-01",
      rating: 5,
      text: "Excellent service! The team was on time and very professional. Lift is running perfectly now.",
    },
    {
      author: "Priya Sharma",
      date: "2024-02-15",
      rating: 5,
      text: "Outstanding work. Completed the maintenance ahead of schedule with zero disruption.",
    },
    {
      author: "Amit Patel",
      date: "2024-02-05",
      rating: 5,
      text: "Best elevator maintenance company we have worked with. Highly recommend.",
    },
  ],
  "CoolAir Services": [
    {
      author: "Sunita Reddy",
      date: "2024-03-03",
      rating: 5,
      text: "Very responsive. Fixed the AC issue within 2 hours of being assigned.",
    },
    {
      author: "Mohan Das",
      date: "2024-02-20",
      rating: 5,
      text: "Professional team, quick diagnosis. AC running better than ever.",
    },
    {
      author: "Kavitha Nair",
      date: "2024-02-12",
      rating: 4,
      text: "Good service. Slightly delayed but quality of work was top-notch.",
    },
  ],
  "QuickFix Plumbing": [
    {
      author: "Ravi Shankar",
      date: "2024-03-02",
      rating: 5,
      text: "Fixed the blockage quickly and cleaned up after. Very satisfied.",
    },
    {
      author: "Deepa Menon",
      date: "2024-02-25",
      rating: 4,
      text: "Reliable plumber. Showed up on time and resolved the issue completely.",
    },
    {
      author: "Suresh Babu",
      date: "2024-02-18",
      rating: 5,
      text: "Excellent work! The issue was more complex than expected but handled well.",
    },
  ],
  "GlassFix Solutions": [
    {
      author: "Ananya Singh",
      date: "2024-02-28",
      rating: 5,
      text: "Window replacement done cleanly and efficiently. Very happy with the outcome.",
    },
    {
      author: "Vikram Rao",
      date: "2024-02-10",
      rating: 4,
      text: "Good work, neat finish. Would recommend for glass and window work.",
    },
  ],
  "UrbanFix Electrical": [
    {
      author: "Lakshmi Iyer",
      date: "2024-03-05",
      rating: 4,
      text: "Resolved the wiring issue safely. Knowledgeable team.",
    },
    {
      author: "Kiran Kumar",
      date: "2024-02-22",
      rating: 3,
      text: "Work was done but took longer than expected. Communication could be better.",
    },
    {
      author: "Meera Pillai",
      date: "2024-02-14",
      rating: 5,
      text: "Great electrical team. Fixed the MCB issue and explained everything clearly.",
    },
  ],
  "SecureFix Services": [
    {
      author: "Rohit Varma",
      date: "2024-03-01",
      rating: 4,
      text: "Good security lock installation. Professional and quick.",
    },
    {
      author: "Pooja Krishnan",
      date: "2024-02-18",
      rating: 5,
      text: "Excellent! Door lock replaced swiftly and securely.",
    },
  ],
  "HeatPro Services": [
    {
      author: "Ganesh Murthy",
      date: "2024-02-28",
      rating: 3,
      text: "Work completed but needed a follow-up visit. Quality should improve.",
    },
    {
      author: "Shanti Devi",
      date: "2024-02-10",
      rating: 4,
      text: "Decent service for boiler work. On time and reasonably priced.",
    },
  ],
  "ProPaint Co.": [
    {
      author: "Arun Joseph",
      date: "2024-02-25",
      rating: 4,
      text: "Clean paint job with good quality materials. Took slightly longer than estimated.",
    },
    {
      author: "Uma Rani",
      date: "2024-02-12",
      rating: 4,
      text: "Happy with the painting work. Good attention to detail.",
    },
  ],
};

/* ============================================================
   NOTIFICATIONS  (localStorage for persistence across pages)
   userCreated: true  → sent by the manager from the notifications form
   userCreated: false → auto-generated by system actions
   ============================================================ */
function getNotifications() {
  const stored = localStorage.getItem("ps_notifications");
  if (stored) return JSON.parse(stored);
  const defaults = [
    {
      id: 1,
      icon: "drop",
      color: "#DCFCE7",
      title: "New complaint submitted",
      desc: "Resident from Building A reported water leakage (C-2410)",
      time: "5 min ago",
      unread: true,
      recipient: "all",
      userCreated: false,
    },
    {
      id: 2,
      icon: "chart",
      color: "#FEF3C7",
      title: "Service estimate received",
      desc: "CoolAir Services submitted estimate for AC repair (C-2401)",
      time: "30 min ago",
      unread: true,
      recipient: "provider",
      userCreated: false,
    },
    {
      id: 3,
      icon: "checkmark",
      color: "#DCFCE7",
      title: "Work completed",
      desc: "Electrical repair completed in Tower B, Apt 304 (C-2395)",
      time: "2 hrs ago",
      unread: false,
      recipient: "all",
      userCreated: false,
    },
    {
      id: 4,
      icon: "warn",
      color: "#FEF3C7",
      title: "Overdue maintenance request",
      desc: "Complaint C-2404 is overdue by 2 days",
      time: "3 hrs ago",
      unread: false,
      recipient: "all",
      userCreated: false,
    },
    {
      id: 5,
      icon: "wrench",
      color: "#F0FDF4",
      title: "Provider assigned",
      desc: "QuickFix Plumbing assigned to C-2407",
      time: "Yesterday",
      unread: false,
      recipient: "provider",
      userCreated: false,
    },
    {
      id: 6,
      icon: "cross",
      color: "#FEE2E2",
      title: "Provider declined assignment",
      desc: "HeatPro Services declined assignment for C-2408",
      time: "Yesterday",
      unread: false,
      recipient: "provider",
      userCreated: false,
    },
    {
      id: 7,
      icon: "money",
      color: "#F0FDF4",
      title: "Payment processed",
      desc: "Payment of ₹4500 processed for C-2385",
      time: "2 days ago",
      unread: false,
      recipient: "all",
      userCreated: false,
    },
    {
      id: 8,
      icon: "clipboard",
      color: "#F0FDF4",
      title: "Complaint awaiting approval",
      desc: "Complaint C-2410 needs your review",
      time: "2 days ago",
      unread: false,
      recipient: "owner",
      userCreated: false,
    },
  ];
  localStorage.setItem("ps_notifications", JSON.stringify(defaults));
  return defaults;
}

function saveNotifications(notifs) {
  localStorage.setItem("ps_notifications", JSON.stringify(notifs));
}

/**
 * addNotification – adds a notification to the store.
 * @param {string} icon
 * @param {string} color
 * @param {string} title
 * @param {string} desc
 * @param {string} recipient  – 'all' | 'owner' | 'resident' | 'provider'
 * @param {boolean} userCreated – true when manager manually sends from the form
 */
function addNotification(icon, color, title, desc, recipient, userCreated) {
  const notifs = getNotifications();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  notifs.unshift({
    id: Date.now(),
    icon,
    color,
    title,
    desc,
    time: "Just now at " + time,
    unread: true,
    recipient: recipient || "all",
    userCreated: userCreated === true,
  });
  saveNotifications(notifs);
  updateNotifDot();
}

/* CREATE NOTIFICATION (from notifications page) */
function createCustomNotification(title, desc, recipient, icon, color) {
  addNotification(
    icon || "bell",
    color || "#DCFCE7",
    title,
    desc,
    recipient,
    true,
  );
  showToast(`✅ Notification sent to ${recipientLabel(recipient)}.`);
}

function recipientLabel(r) {
  const map = {
    all: "All Users",
    owner: "Property Owner",
    resident: "Resident",
    provider: "Service Provider",
  };
  return map[r] || r;
}

function getUnreadCount() {
  // Only count received (non-userCreated) unread notifications for the dot
  return getNotifications().filter((n) => n.unread && !n.userCreated).length;
}

/* ============================================================
   ICON MAP
   ============================================================ */
const iconMap = {
  drop: "💧",
  chart: "📊",
  checkmark: "✅",
  warn: "⚠️",
  wrench: "🔧",
  cross: "❌",
  money: "💰",
  clipboard: "📋",
  bell: "🔔",
  person: "👤",
};
function notifIcon(icon) {
  return iconMap[icon] || icon;
}

/* ============================================================
   BADGES
   ============================================================ */
function priorityBadge(p) {
  const m = { High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `<span class="badge ${m[p] || "badge-medium"}">${p}</span>`;
}

function statusBadge(s, sub) {
  const m = {
    Pending: "badge-pending",
    Approved: "badge-approved",
    "In Progress": "badge-inprogress",
    Completed: "badge-completed",
    Billed: "badge-payment",
    Paid: "badge-completed",
    Closed: "badge-completed",
    "Payment Pending": "badge-payment",
    Rejected: "badge-rejected",
  };
  let label = s;
  if (s === "Approved" && sub) label = sub;
  return `<span class="badge ${m[s] || "badge-pending"}">${label}</span>`;
}

/* ============================================================
   MODALS
   ============================================================ */
function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("open");
    el.style.display = "flex";
  }
}
function hideModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("open");
    el.style.display = "";
  }
}
document.addEventListener("click", (e) => {
  document.querySelectorAll(".modal-overlay").forEach((o) => {
    if (e.target === o) hideModal(o.id);
  });
});

/* ============================================================
   REJECT MODAL
   ============================================================ */
let _rejectTarget = "";
let _rejectCallback = null;

function openRejectModal(id, callback) {
  _rejectTarget = id;
  _rejectCallback = callback || null;
  const inp = document.getElementById("rejectReason");
  if (inp) inp.value = "";
  const titleEl = document.getElementById("rejectModalComplaintId");
  if (titleEl) titleEl.textContent = id;
  showModal("rejectModal");
}

function submitReject() {
  const r = (document.getElementById("rejectReason") || {}).value || "";
  if (!r.trim()) {
    showToast("Please enter a rejection reason.");
    return;
  }
  rejectComplaintById(_rejectTarget, r.trim());
  hideModal("rejectModal");
  showToast(`Complaint ${_rejectTarget} rejected. Reason sent to resident.`);
  if (_rejectCallback) _rejectCallback(_rejectTarget, r.trim());
  else if (typeof renderTable === "function") {
    complaints = getComplaints();
    renderTable();
  } else if (typeof renderDashboardComplaints === "function") {
    complaints = getComplaints();
    renderDashboardComplaints();
  }
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, dur = 3500) {
  let t = document.getElementById("_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "_toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), dur);
}

/* ============================================================
   SIDEBAR – always an overlay, NEVER affects page layout
   Hamburger = open, Cross/overlay = close only
   Page content NEVER shifts or changes size at all
   ============================================================ */
function openSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (!sidebar) return;
  sidebar.classList.add("open");
  if (overlay) overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (!sidebar) return;
  sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
  /* NO layout changes whatsoever – page wrapper stays exactly as-is */
}

/* ============================================================
   ALERT HELPERS
   ============================================================ */
function markAlertRead(btn) {
  const li = btn.closest("li");
  if (!li) return;
  li.style.transition = "opacity .3s";
  li.style.opacity = "0";
  setTimeout(() => {
    li.remove();
    checkAlertsEmpty();
  }, 300);
}
function clearAllAlerts() {
  const ul = document.querySelector(".alert-box ul");
  if (!ul) return;
  [...ul.children].forEach((li) => {
    li.style.transition = "opacity .3s";
    li.style.opacity = "0";
  });
  setTimeout(() => {
    if (ul) ul.innerHTML = "";
    checkAlertsEmpty();
  }, 320);
}
function checkAlertsEmpty() {
  const box = document.querySelector(".alert-box");
  if (!box) return;
  const ul = box.querySelector("ul");
  if (ul && ul.children.length === 0) {
    box.style.transition = "opacity .3s";
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 320);
  }
}

/* ============================================================
   NOTIFICATION HELPERS
   ============================================================ */
function markNotifRead(id) {
  const notifs = getNotifications();
  const n = notifs.find((x) => x.id === id);
  if (n && n.unread) {
    n.unread = false;
    saveNotifications(notifs);
    updateNotifDot();
  }
  if (typeof renderNotifs === "function") renderNotifs();
}

function markAllNotifsRead() {
  const notifs = getNotifications();
  notifs.forEach((n) => (n.unread = false));
  saveNotifications(notifs);
  updateNotifDot();
  if (typeof renderNotifs === "function") renderNotifs();
  showToast("All notifications marked as read.");
}

function clearAllNotifs() {
  saveNotifications([]);
  updateNotifDot();
  if (typeof renderNotifs === "function") renderNotifs();
  showToast("All notifications cleared.");
}

/* ============================================================
   LOGOUT
   ============================================================ */
function confirmLogout() {
  showModal("logoutModal");
}
function doLogout() {
  hideModal("logoutModal");
  localStorage.removeItem("currentUser");
  showToast("Logged out successfully.");
  setTimeout(() => (location.href = "../login_signup.html"), 1200);
}

/* ============================================================
   NOTIF DOT UPDATE
   ============================================================ */
function updateNotifDot() {
  const count = getUnreadCount();
  document.querySelectorAll(".topbar-notif-dot").forEach((dot) => {
    dot.style.display = count > 0 ? "block" : "none";
  });
  document.querySelectorAll(".notif-badge-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "inline" : "none";
  });
  document.querySelectorAll(".notif-complaints-count").forEach((el) => {
    const pCount = getComplaints().filter((c) => c.status === "Pending").length;
    el.textContent = pCount;
    el.style.display = pCount > 0 ? "inline" : "none";
  });
}

/* ============================================================
   DOM INIT – sidebar is HIDDEN by default, only hamburger opens it
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  /* Sidebar always starts CLOSED on every page load */
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");

  /* Hamburger → open sidebar (overlay only, no layout shift) */
  document.querySelectorAll(".hamburger").forEach((btn) => {
    btn.addEventListener("click", openSidebar);
  });

  /* Cross button → close sidebar only, nothing else changes */
  document.querySelectorAll(".sidebar-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  });

  /* Clicking the dark overlay also closes sidebar */
  document
    .querySelector(".sidebar-overlay")
    ?.addEventListener("click", closeSidebar);

  /* Clicking a nav link closes sidebar (then navigates) */
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });

  // Active nav highlight based on current page
  const page = location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = (link.getAttribute("href") || "").split("/").pop();
    if (href === page) link.classList.add("active");
  });

  updateNotifDot();
});
