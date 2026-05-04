/* PropSync maintenance_manager.js – unified shared JS (Backend-driven) */

/* ============================================================
   BACKEND CONFIG
   ============================================================ */
const MM_API = "http://localhost:3000";
const MM_HEADERS = {
  "Content-Type": "application/json",
  "role": "maintenance_manager",
  "user-email": "manager@propsync.com",
};

/* ============================================================
   COMPLAINTS  (fetched from backend)
   ============================================================ */

/**
 * Fetch all complaints from backend.
 * Normalizes backend field names to the ones used by the HTML templates.
 */
async function getComplaints() {
  try {
    const res = await fetch(`${MM_API}/complaints`, { headers: MM_HEADERS });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    // Normalize backend → frontend field names
    return data.map((c) => ({
      id: c.id,
      issue: c.title || c.category || "Untitled",
      location: c.location || "",
      priority: c.priority || "Medium",
      status: c.status || "Pending",
      subStatus: c.subStatus || "",
      submitted: c.reportedDate || "",
      deadline: c.deadline || "",
      provider: c.assignedTo || "",
      rejectionReason: c.rejectionReason || "",
      // Keep raw fields too for detail views
      title: c.title,
      category: c.category,
      description: c.description,
      issuedBy: c.issuedBy,
      image: c.image,
      serviceProviderQueue: c.serviceProviderQueue || [],
      reportedDate: c.reportedDate,
      assignedTo: c.assignedTo,
    }));
  } catch (err) {
    console.error("getComplaints error:", err);
    return [];
  }
}

async function approveComplaintById(id) {
  try {
    await fetch(`${MM_API}/complaints/${id}/approved`, {
      method: "PATCH",
      headers: MM_HEADERS,
    });
    await addNotification(
      "checkmark",
      "#DCFCE7",
      "Complaint Approved",
      `Complaint ${id} approved and moved to Approved Complaints`,
      "all",
      false
    );
  } catch (err) {
    console.error("approveComplaintById error:", err);
  }
}

async function rejectComplaintById(id, reason) {
  try {
    await fetch(`${MM_API}/complaints/${id}/rejected`, {
      method: "PATCH",
      headers: MM_HEADERS,
      body: JSON.stringify({ reason }),
    });
    await addNotification(
      "cross",
      "#FEE2E2",
      "Complaint Rejected",
      `Complaint ${id} rejected. Rejection reason sent to resident.`,
      "all",
      false
    );
  } catch (err) {
    console.error("rejectComplaintById error:", err);
  }
}

/* ============================================================
   PROVIDERS  (static data – no backend endpoint yet)
   ============================================================ */
const providers = [
  {
    name: "Urban Lift Repairs",
    specialty: "Elevator",
    rating: 4.9,
    jobs: 54,
    onTime: 98,
    avgCost: 4200,
    trend: "up",
  },
  {
    name: "CoolAir Services",
    specialty: "HVAC",
    rating: 4.8,
    jobs: 142,
    onTime: 95,
    avgCost: 2800,
    trend: "up",
  },
  {
    name: "QuickFix Plumbing",
    specialty: "Plumbing",
    rating: 4.6,
    jobs: 98,
    onTime: 88,
    avgCost: 1200,
    trend: "up",
  },
  {
    name: "GlassFix Solutions",
    specialty: "General",
    rating: 4.7,
    jobs: 65,
    onTime: 91,
    avgCost: 1600,
    trend: "up",
  },
  {
    name: "UrbanFix Electrical",
    specialty: "Electrical",
    rating: 4.5,
    jobs: 112,
    onTime: 82,
    avgCost: 1800,
    trend: "down",
  },
  {
    name: "SecureFix Services",
    specialty: "Security",
    rating: 4.4,
    jobs: 88,
    onTime: 85,
    avgCost: 900,
    trend: "",
  },
  {
    name: "HeatPro Services",
    specialty: "Plumbing",
    rating: 4.3,
    jobs: 76,
    onTime: 79,
    avgCost: 2200,
    trend: "down",
  },
  {
    name: "ProPaint Co.",
    specialty: "Painting",
    rating: 4.2,
    jobs: 43,
    onTime: 80,
    avgCost: 3500,
    trend: "",
  },
];

const providerReviews = {
  "Urban Lift Repairs": [
    { author: "Rajesh Kumar", date: "2024-03-01", rating: 5, text: "Excellent service! The team was on time and very professional. Lift is running perfectly now." },
    { author: "Priya Sharma", date: "2024-02-15", rating: 5, text: "Outstanding work. Completed the maintenance ahead of schedule with zero disruption." },
    { author: "Amit Patel", date: "2024-02-05", rating: 5, text: "Best elevator maintenance company we have worked with. Highly recommend." },
  ],
  "CoolAir Services": [
    { author: "Sunita Reddy", date: "2024-03-03", rating: 5, text: "Very responsive. Fixed the AC issue within 2 hours of being assigned." },
    { author: "Mohan Das", date: "2024-02-20", rating: 5, text: "Professional team, quick diagnosis. AC running better than ever." },
    { author: "Kavitha Nair", date: "2024-02-12", rating: 4, text: "Good service. Slightly delayed but quality of work was top-notch." },
  ],
  "QuickFix Plumbing": [
    { author: "Ravi Shankar", date: "2024-03-02", rating: 5, text: "Fixed the blockage quickly and cleaned up after. Very satisfied." },
    { author: "Deepa Menon", date: "2024-02-25", rating: 4, text: "Reliable plumber. Showed up on time and resolved the issue completely." },
    { author: "Suresh Babu", date: "2024-02-18", rating: 5, text: "Excellent work! The issue was more complex than expected but handled well." },
  ],
  "GlassFix Solutions": [
    { author: "Ananya Singh", date: "2024-02-28", rating: 5, text: "Window replacement done cleanly and efficiently. Very happy with the outcome." },
    { author: "Vikram Rao", date: "2024-02-10", rating: 4, text: "Good work, neat finish. Would recommend for glass and window work." },
  ],
  "UrbanFix Electrical": [
    { author: "Lakshmi Iyer", date: "2024-03-05", rating: 4, text: "Resolved the wiring issue safely. Knowledgeable team." },
    { author: "Kiran Kumar", date: "2024-02-22", rating: 3, text: "Work was done but took longer than expected. Communication could be better." },
    { author: "Meera Pillai", date: "2024-02-14", rating: 5, text: "Great electrical team. Fixed the MCB issue and explained everything clearly." },
  ],
  "SecureFix Services": [
    { author: "Rohit Varma", date: "2024-03-01", rating: 4, text: "Good security lock installation. Professional and quick." },
    { author: "Pooja Krishnan", date: "2024-02-18", rating: 5, text: "Excellent! Door lock replaced swiftly and securely." },
  ],
  "HeatPro Services": [
    { author: "Ganesh Murthy", date: "2024-02-28", rating: 3, text: "Work completed but needed a follow-up visit. Quality should improve." },
    { author: "Shanti Devi", date: "2024-02-10", rating: 4, text: "Decent service for boiler work. On time and reasonably priced." },
  ],
  "ProPaint Co.": [
    { author: "Arun Joseph", date: "2024-02-25", rating: 4, text: "Clean paint job with good quality materials. Took slightly longer than estimated." },
    { author: "Uma Rani", date: "2024-02-12", rating: 4, text: "Happy with the painting work. Good attention to detail." },
  ],
};

/* ============================================================
   NOTIFICATIONS  (fetched from backend)
   ============================================================ */
async function getNotifications() {
  try {
    const res = await fetch(`${MM_API}/notifications`, { headers: MM_HEADERS });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    // Normalize backend fields to what the MM templates expect
    return data.map((n) => ({
      id: n.id,
      icon: n.type === "complaint" ? "clipboard" : n.type === "system" ? "bell" : "checkmark",
      color: n.isRead ? "#F0FDF4" : "#DCFCE7",
      title: n.title,
      desc: n.message,
      time: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now",
      unread: !n.isRead,
      recipient: n.forRole === "all" ? "all" : n.forRole,
      userCreated: false,
      // Raw fields
      isRead: n.isRead,
      createdAt: n.createdAt,
      forRole: n.forRole,
      forUser: n.forUser,
    }));
  } catch (err) {
    console.error("getNotifications error:", err);
    return [];
  }
}

async function addNotification(icon, color, title, desc, recipient, userCreated) {
  try {
    // Map the old icon/recipient system to backend notification format
    const typeMap = { checkmark: "complaint", cross: "complaint", bell: "system", clipboard: "complaint", warn: "system", money: "system", wrench: "complaint", drop: "complaint", chart: "system" };
    await fetch(`${MM_API}/notifications`, {
      method: "POST",
      headers: MM_HEADERS,
      body: JSON.stringify({
        title,
        message: desc,
        type: typeMap[icon] || "system",
        forRole: recipient === "provider" ? "service_provider" : recipient === "owner" ? "owner" : "all",
      }),
    });
    updateNotifDot();
  } catch (err) {
    console.error("addNotification error:", err);
  }
}

/* CREATE NOTIFICATION (from notifications page) */
async function createCustomNotification(title, desc, recipient, icon, color) {
  await addNotification(
    icon || "bell",
    color || "#DCFCE7",
    title,
    desc,
    recipient,
    true
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

async function getUnreadCount() {
  const notifs = await getNotifications();
  return notifs.filter((n) => n.unread).length;
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
    "Payment Pending": "badge-payment",
    Rejected: "badge-rejected",
    Assigned: "badge-approved",
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

async function submitReject() {
  const r = (document.getElementById("rejectReason") || {}).value || "";
  if (!r.trim()) {
    showToast("Please enter a rejection reason.");
    return;
  }
  await rejectComplaintById(_rejectTarget, r.trim());
  hideModal("rejectModal");
  showToast(`Complaint ${_rejectTarget} rejected. Reason sent to resident.`);
  if (_rejectCallback) _rejectCallback(_rejectTarget, r.trim());
  else if (typeof renderTable === "function") {
    await renderTable();
  } else if (typeof renderDashboardComplaints === "function") {
    await renderDashboardComplaints();
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
async function markNotifRead(id) {
  try {
    await fetch(`${MM_API}/notifications/${id}/read`, {
      method: "PATCH",
      headers: MM_HEADERS,
    });
    updateNotifDot();
  } catch (err) {
    console.error("markNotifRead error:", err);
  }
  if (typeof renderNotifs === "function") await renderNotifs();
}

async function markAllNotifsRead() {
  try {
    await fetch(`${MM_API}/notifications/read-all`, {
      method: "PATCH",
      headers: MM_HEADERS,
    });
    updateNotifDot();
  } catch (err) {
    console.error("markAllNotifsRead error:", err);
  }
  if (typeof renderNotifs === "function") await renderNotifs();
  showToast("All notifications marked as read.");
}

async function clearAllNotifs() {
  try {
    const notifs = await getNotifications();
    for (const n of notifs) {
      await fetch(`${MM_API}/notifications/${n.id}`, {
        method: "DELETE",
        headers: MM_HEADERS,
      });
    }
    updateNotifDot();
  } catch (err) {
    console.error("clearAllNotifs error:", err);
  }
  if (typeof renderNotifs === "function") await renderNotifs();
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
  showToast("Logged out successfully.");
  setTimeout(() => (location.href = "../login_signup.html"), 1200);
}

/* ============================================================
   NOTIF DOT UPDATE  (now async)
   ============================================================ */
async function updateNotifDot() {
  try {
    const count = await getUnreadCount();
    document.querySelectorAll(".topbar-notif-dot").forEach((dot) => {
      dot.style.display = count > 0 ? "block" : "none";
    });
    document.querySelectorAll(".notif-badge-count").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline" : "none";
    });
    const complaints = await getComplaints();
    const pCount = complaints.filter((c) => c.status === "Pending").length;
    document.querySelectorAll(".notif-complaints-count").forEach((el) => {
      el.textContent = pCount;
      el.style.display = pCount > 0 ? "inline" : "none";
    });
  } catch (err) {
    console.error("updateNotifDot error:", err);
  }
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
