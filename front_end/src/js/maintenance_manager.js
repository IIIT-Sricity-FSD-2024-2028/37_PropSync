/* PropSync app.js – unified shared JS */

/* ============================================================
   COMPLAINTS
   ============================================================ */
function getComplaints() {
  const stored = sessionStorage.getItem("ps_complaints");
  if (stored) return JSON.parse(stored);
  const defaults = [
    {
      id: "C-2410",
      issue: "Water Leakage",
      location: "Building A, Apt 102",
      priority: "High",
      status: "Pending",
      subStatus: "",
      submitted: "2024-03-08",
      deadline: "2024-03-12",
      provider: "",
      rejectionReason: "",
    },
    {
      id: "C-2409",
      issue: "AC Not Cooling",
      location: "Tower B, Apt 305",
      priority: "Medium",
      status: "Pending",
      subStatus: "",
      submitted: "2024-03-07",
      deadline: "2024-03-14",
      provider: "",
      rejectionReason: "",
    },
    {
      id: "C-2408",
      issue: "Electrical Issue",
      location: "Tower B, Apt 304",
      priority: "High",
      status: "Approved",
      subStatus: "Waiting Provider Response",
      submitted: "2024-03-06",
      deadline: "2024-03-13",
      provider: "",
      rejectionReason: "",
    },
    {
      id: "C-2407",
      issue: "Plumbing Problem",
      location: "Building C, Apt 201",
      priority: "Medium",
      status: "Approved",
      subStatus: "Waiting Cost Approval",
      submitted: "2024-03-05",
      deadline: "2024-03-15",
      provider: "QuickFix Plumbing",
      rejectionReason: "",
    },
    {
      id: "C-2406",
      issue: "Door Lock Repair",
      location: "Building A, Apt 305",
      priority: "Low",
      status: "Approved",
      subStatus: "Provider Assigned",
      submitted: "2024-03-04",
      deadline: "2024-03-16",
      provider: "SecureFix Services",
      rejectionReason: "",
    },
    {
      id: "C-2405",
      issue: "Paint Work",
      location: "Tower C, Apt 101",
      priority: "Low",
      status: "In Progress",
      subStatus: "",
      submitted: "2024-03-03",
      deadline: "2024-03-17",
      provider: "ProPaint Co.",
      rejectionReason: "",
    },
    {
      id: "C-2404",
      issue: "Window Repair",
      location: "Building B, Apt 409",
      priority: "Medium",
      status: "In Progress",
      subStatus: "",
      submitted: "2024-03-02",
      deadline: "2024-03-10",
      provider: "GlassFix Solutions",
      rejectionReason: "",
    },
    {
      id: "C-2403",
      issue: "Lift Maintenance",
      location: "Main Building",
      priority: "High",
      status: "Completed",
      subStatus: "",
      submitted: "2024-02-25",
      deadline: "2024-03-05",
      provider: "Urban Lift Repairs",
      rejectionReason: "",
    },
    {
      id: "C-2402",
      issue: "Ceiling Fan Not Working",
      location: "Tower A, Apt 210",
      priority: "Low",
      status: "Completed",
      subStatus: "",
      submitted: "2024-02-22",
      deadline: "2024-03-01",
      provider: "UrbanFix Electrical",
      rejectionReason: "",
    },
    {
      id: "C-2401",
      issue: "AC Not Cooling",
      location: "Building D, Apt 102",
      priority: "Medium",
      status: "Payment Pending",
      subStatus: "",
      submitted: "2024-02-20",
      deadline: "2024-02-28",
      provider: "CoolAir Services",
      rejectionReason: "",
    },
    {
      id: "C-2400",
      issue: "Water Leakage",
      location: "Tower B, Apt 102",
      priority: "High",
      status: "Rejected",
      subStatus: "",
      submitted: "2024-02-18",
      deadline: "",
      provider: "",
      rejectionReason: "Duplicate complaint",
    },
    {
      id: "C-2399",
      issue: "AC Not Cooling",
      location: "Building A, Apt 410",
      priority: "Medium",
      status: "Payment Pending",
      subStatus: "",
      submitted: "2024-03-04",
      deadline: "2024-03-20",
      provider: "CoolAir Services",
      rejectionReason: "",
    },
    {
      id: "C-2398",
      issue: "Boiler Servicing",
      location: "Basement Block B",
      priority: "High",
      status: "Payment Pending",
      subStatus: "",
      submitted: "2024-03-03",
      deadline: "2024-03-18",
      provider: "HeatPro Services",
      rejectionReason: "",
    },
    {
      id: "C-2395",
      issue: "Sink Blockage",
      location: "Building C, Apt 303",
      priority: "Low",
      status: "Completed",
      subStatus: "",
      submitted: "2024-02-26",
      deadline: "2024-03-01",
      provider: "QuickFix Plumbing",
      rejectionReason: "",
    },
    {
      id: "C-2390",
      issue: "AC Repair",
      location: "Tower A, Apt 101",
      priority: "Medium",
      status: "Completed",
      subStatus: "",
      submitted: "2024-02-14",
      deadline: "2024-02-20",
      provider: "CoolAir Services",
      rejectionReason: "",
    },
    {
      id: "C-2385",
      issue: "Lift Maintenance",
      location: "Main Building",
      priority: "High",
      status: "Completed",
      subStatus: "",
      submitted: "2024-02-10",
      deadline: "2024-02-15",
      provider: "Urban Lift Repairs",
      rejectionReason: "",
    },
  ];
  sessionStorage.setItem("ps_complaints", JSON.stringify(defaults));
  return defaults;
}

let complaints = getComplaints();

function saveComplaints(data) {
  complaints = data;
  sessionStorage.setItem("ps_complaints", JSON.stringify(data));
}

function approveComplaintById(id) {
  const data = getComplaints();
  const c = data.find((x) => x.id === id);
  if (c) {
    c.status = "Approved";
    c.subStatus = "Provider Assigned";
    saveComplaints(data);
    addNotification(
      "checkmark",
      "#DCFCE7",
      "Complaint Approved",
      `Complaint ${id} (${c.issue}) approved and moved to Approved Complaints`,
      "all",
      false,
    );
  }
}

function rejectComplaintById(id, reason) {
  const data = getComplaints();
  const c = data.find((x) => x.id === id);
  if (c) {
    c.status = "Rejected";
    c.rejectionReason = reason;
    saveComplaints(data);
    addNotification(
      "cross",
      "#FEE2E2",
      "Complaint Rejected",
      `Complaint ${id} rejected. Rejection reason sent to resident.`,
      "all",
      false,
    );
  }
}

/* ============================================================
   PROVIDERS
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
