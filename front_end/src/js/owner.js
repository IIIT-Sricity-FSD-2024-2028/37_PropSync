const menuBtn = document.querySelector(".menu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

if (menuBtn && sidebar && overlay) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  });
}

if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
  });
});

//new complaint
let complaints = [];

async function fetchComplaint() {
  try {
    const response = await fetch("../../data/complaints.json");
    const jsonComplaints = await response.json();

    const localComplaint =
      JSON.parse(localStorage.getItem("newComplaint")) || [];

    complaints = [...jsonComplaints, ...localComplaint];

    console.log("All complaints:", complaints);

    loadComplaints(complaints);
  } catch (error) {
    console.log("Error loading complaints:", error);
  }
}

fetchComplaint();

const comp_container = document.querySelector(".complaints-container");

function loadComplaints(data) {
  if (!comp_container) return;

  comp_container.innerHTML = "";

  if (!data || data.length === 0) {
    comp_container.innerHTML = "<p>No complaints found.</p>";
    return;
  }

  data.forEach((c) => {
    const div = document.createElement("div");
    div.className = "complaint-card";

    // Make card clickable — navigate to detail page with complaint id
    div.style.cursor = "pointer";
    div.addEventListener("click", () => {
      window.location.href = `./complaint_details.html?id=${c.id}`;
    });

    let statusClass = "pending";

    switch ((c.status || "").toLowerCase()) {
      case "pending":
        statusClass = "pending";
        break;

      case "approved":
        statusClass = "approved";
        break;

      case "estimating cost":
        statusClass = "estimating";
        break;

      case "assigned":
        statusClass = "assigned";
        break;

      case "resolved":
        statusClass = "resolved";
        break;
    }

    div.innerHTML = `
      <div class="card-left">
        <h3>${c.title}</h3>

        <p class="description">
          ${c.caption}
        </p>

        <div class="tag-row">
          <span class="tag green">
            Id: C-${c.id}
          </span>

          <span class="tag blue">
            Category: ${c.category}
          </span>
        </div>
      </div>

      <div class="status ${statusClass}">
        ${c.status}
      </div>
    `;

    comp_container.append(div);
  });
}

const search = document.querySelector(".search-box");
const statusFilter = document.querySelector(".status-filter");

if (search && statusFilter) {
  function applyFilters() {
    const searchValue = search.value.toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();

    const filtered = complaints.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchValue);

      const matchesStatus =
        selectedStatus === "all status" ||
        (c.status || "").toLowerCase() === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    loadComplaints(filtered);
  }

  search.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
}

const form = document.getElementById("complaintForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("form_title").value.trim();
    const caption = document.getElementById("desc").value.trim();
    const category = document.getElementById("complaint_cat").value;
    const imageInput = document.getElementById("form_image");
    const file = imageInput.files[0];
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const issuedBy = currentUser.email || "unknown@user.com";
    let imageData = "";

    if (file) {
      imageData = await toBase64(file);
    }

    const newComplaint = {
      id: Date.now(),
      title: title,
      caption: caption,
      status: "pending",
      category: category,
      issuedBy: issuedBy,
      serviceProviderQueue: [],
      assignedTo: null,
      image: imageData,
    };

    let stored = JSON.parse(localStorage.getItem("newComplaint")) || [];
    stored.push(newComplaint);
    localStorage.setItem("newComplaint", JSON.stringify(stored));
    alert("Complaint submitted successfully!");
    window.location.href = "../owner/dashboard.html";
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error);
  });
}

function deleteComplaint(id) {
  let stored = JSON.parse(localStorage.getItem("newComplaint")) || [];
  stored = stored.filter((c) => c.id !== id);
  localStorage.setItem("newComplaint", JSON.stringify(stored));
  complaints = complaints.filter((c) => c.id !== id);
  loadComplaints(complaints);
}

//payments history
const container = document.querySelector(".payments");
let payments = [];

async function fetchPayments() {
  try {
    const response = await fetch("../../data/owner_payments.json");
    const jsonPayments = await response.json();
    const localPayments = JSON.parse(localStorage.getItem("payments")) || [];

    payments = [...jsonPayments, ...localPayments];
    loadPayments(payments);
  } catch (error) {
    console.log("Error loading payments:", error);
  }
}
fetchPayments();

function loadPayments(data) {
  if (!container) return;

  container.innerHTML = "";

  data.forEach((p) => {
    const div = document.createElement("div");

    div.className = p.status === "pending" ? "payment pending" : "payment";

    div.innerHTML = `
      <div class="row">
        <h3>${p.month}</h3>

        <span class="status ${
          p.status === "pending" ? "pending-badge" : "paid"
        }">
          ${p.status}
        </span>
      </div>

      <p class="amount">
        <b>Amount:</b> $${p.amount}
        ${
          p.status === "paid"
            ? `&nbsp;&nbsp; <b>Paid on:</b> ${formatDate(p.paidOn)}`
            : ""
        }
      </p>

      ${
        p.status === "pending"
          ? `
        <input type="file" onchange="uploadReceipt(event, ${p.id})" accept="image/*" />
        <button onclick="submitPayment(${p.id})">
          Upload
        </button>
      `
          : `
        <p class="success conform"><svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <g clip-path="url(#clip0_1144_156)">
                <path
                  d="M14.5341 6.66666C14.8385 8.16086 14.6215 9.71428 13.9193 11.0679C13.2171 12.4214 12.072 13.4934 10.6751 14.1049C9.27816 14.7164 7.71382 14.8305 6.24293 14.4282C4.77205 14.026 3.48353 13.1316 2.59225 11.8943C1.70097 10.657 1.26081 9.15148 1.34518 7.62892C1.42954 6.10635 2.03332 4.65872 3.05583 3.52744C4.07835 2.39616 5.45779 1.64961 6.96411 1.4123C8.47043 1.17498 10.0126 1.46123 11.3334 2.22333"
                  stroke="#008236"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6 7.33329L8 9.33329L14.6667 2.66663"
                  stroke="#008236"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_1144_156">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs></svg
            >
          Payment confirmation uploaded
        </p>
      `
      }
    `;

    container.append(div);
  });
}

let tempReceipt = {};

function uploadReceipt(event, id) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    tempReceipt[id] = reader.result;
  };
  reader.readAsDataURL(file);
}

function submitPayment(id) {
  const receipt = tempReceipt[id];

  if (!receipt) {
    alert("Please upload receipt first");
    return;
  }

  const index = payments.findIndex((p) => p.id === id);
  payments[index].status = "paid";
  payments[index].paidOn = new Date().toISOString().split("T")[0];
  payments[index].receipt = receipt;
  localStorage.setItem("payments", JSON.stringify(payments));
  loadPayments(payments);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

//notifications
const notify_container = document.querySelector(".notifications");
const unreadBadge = document.querySelector(".unread-badge");
const markAllBtn = document.querySelector(".btn.green");
const clearAllBtn = document.querySelector(".btn.outline");

let notifications = [];

async function fetchNotifications() {
  try {
    const response = await fetch("../../data/notifications.json");
    const jsonNotifications = await response.json();

    const localNotifications =
      JSON.parse(localStorage.getItem("notifications")) || [];

    const map = new Map();

    [...jsonNotifications, ...localNotifications].forEach((n) => {
      map.set(n.id, n);
    });

    notifications = Array.from(map.values());

    loadNotifications(notifications);
  } catch (error) {
    console.log("Error loading notifications:", error);
  }
}

fetchNotifications();

function loadNotifications(data) {
  if (!notify_container) return;

  notify_container.innerHTML = "";

  if (!data || data.length === 0) {
    notify_container.innerHTML = "<p>No notifications.</p>";
    updateUnreadCount();
    return;
  }

  data.forEach((n) => {
    const div = document.createElement("div");

    div.className =
      n.status === "read" ? "notification_card" : "notification_card read";

    const iconColor = n.type === "Deadline" ? "red" : "green";

    const newTag =
      n.status === "unread" ? `<span class="tag new">New</span>` : "";

    div.innerHTML = `
      <div class="icon ${iconColor}">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
          <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
          <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
        </svg>
      </div>

      <div class="notifi_content">

        <div class="notifi_item">
          <h3>
            ${n.title}
            ${newTag}
          </h3>

          <span class="time">
            ${n.time}
          </span>
        </div>

        <span class="badge">
          ${n.type}
        </span>

        <p>
          ${n.message}
        </p>

        <div class="actions">
          <span class="mark">✓ Mark as Read</span>
          <span class="delete">🗑 Delete</span>
        </div>

      </div>
    `;

    const markBtn = div.querySelector(".mark");
    const deleteBtn = div.querySelector(".delete");

    markBtn.addEventListener("click", () => {
      markAsRead(n.id);
      n.classList.remove("read");
    });

    deleteBtn.addEventListener("click", () => {
      deleteNotification(n.id);
    });

    notify_container.append(div);
  });

  updateUnreadCount();
}

function updateUnreadCount() {
  if (!unreadBadge) return;

  const unread = notifications.filter((n) => n.status === "unread").length;

  unreadBadge.textContent = `${unread} Unread`;
}

function markAsRead(id) {
  notifications = notifications.map((n) => {
    if (n.id === id) {
      return {
        ...n,
        status: "read",
      };
    }
    return n;
  });

  saveNotifications();
  loadNotifications(notifications);
}

function deleteNotification(id) {
  notifications = notifications.filter((n) => n.id !== id);

  saveNotifications();
  loadNotifications(notifications);
}

if (markAllBtn) {
  markAllBtn.addEventListener("click", () => {
    notifications = notifications.map((n) => ({
      ...n,
      status: "read",
    }));

    saveNotifications();
    loadNotifications(notifications);
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    notifications = [];

    saveNotifications();
    loadNotifications(notifications);
  });
}

function saveNotifications() {
  localStorage.setItem("notifications", JSON.stringify(notifications));
}

// ─────────────────────────────────────────────
// Complaint Details Page — reads ?id= from URL
// ─────────────────────────────────────────────
async function loadComplaintDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  // Load all complaints (JSON + localStorage)
  let allComplaints = [];
  try {
    const response = await fetch("../../data/complaints.json");
    const jsonComplaints = await response.json();
    const localComplaints =
      JSON.parse(localStorage.getItem("newComplaint")) || [];
    allComplaints = [...jsonComplaints, ...localComplaints];
  } catch {
    allComplaints = JSON.parse(localStorage.getItem("newComplaint")) || [];
  }

  // Match by id (loose comparison handles both string and number ids)
  const c = allComplaints.find((x) => String(x.id) === String(id));

  if (!c) {
    document.querySelector(".main").innerHTML =
      `<p style="padding:2rem;color:red;">Complaint not found.</p>`;
    return;
  }

  // ── Helper: map status → stepper step index (1-based) ──
  const statusStepMap = {
    pending: 1,
    approved: 2,
    assigned: 3,
    "estimating cost": 4,
    "in progress": 5,
    resolved: 6,
  };
  const currentStep = statusStepMap[(c.status || "").toLowerCase()] || 1;

  // ── Stepper ──
  const stepCircles = document.querySelectorAll(".step-circle");
  const stepConnectors = document.querySelectorAll(".step-connector");
  const stepLabels = document.querySelectorAll(".step-label");

  stepCircles.forEach((el, i) => {
    el.classList.remove("done", "current");
    stepLabels[i]?.classList.remove("active");
    if (i + 1 < currentStep) {
      el.classList.add("done");
      el.textContent = "✓";
      stepLabels[i]?.classList.add("active");
      if (stepConnectors[i]) stepConnectors[i].classList.add("done");
    } else if (i + 1 === currentStep) {
      el.classList.add("current");
      el.textContent = i + 1;
      stepLabels[i]?.classList.add("active");
    } else {
      el.textContent = i + 1;
    }
  });

  // ── Complaint Information card ──
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("detail-title", c.title || "—");
  set("detail-category", c.category || "—");
  set("detail-id", `C-${c.id}`);
  set("detail-issuedby", c.issuedBy || "—");

  const workStatusMap = {
    pending: "Waiting for Maintenance Manager to approve…",
    approved: "Complaint approved. Waiting for provider assignment.",
    assigned: `Assigned to: ${c.assignedTo || "a service provider"}`,
    "estimating cost": "Service provider is submitting cost estimate.",
    "in progress": "Work is currently in progress.",
    resolved: "Work has been completed and resolved.",
  };
  set(
    "detail-workstatus",
    workStatusMap[(c.status || "").toLowerCase()] || c.status || "—",
  );

  // Status badge
  set("detail-status-text", c.status || "pending");
  const badge = document.getElementById("detail-status-badge");
  if (badge) {
    const statusColorMap = {
      pending:
        "background:var(--amber-lt);color:var(--amber);border-color:rgba(217,119,6,.25)",
      approved:
        "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
      assigned:
        "background:var(--blue-lt);color:var(--blue);border-color:rgba(29,78,216,.25)",
      "estimating cost":
        "background:#f5f3ff;color:#7c3aed;border-color:rgba(124,58,237,.25)",
      "in progress":
        "background:var(--teal-lt);color:var(--teal);border-color:rgba(13,148,136,.25)",
      resolved:
        "background:#f3f4f6;color:#374151;border-color:rgba(55,65,81,.25)",
    };
    badge.style.cssText = statusColorMap[(c.status || "").toLowerCase()] || "";
  }

  // ── Lifecycle list ──
  const lcItems = document.querySelectorAll(".lc-item");
  const lifecycleStages = [
    { name: "Complaint Submitted", date: c.submittedOn || null },
    { name: "Complaint Approved", date: null },
    { name: "Service Provider Assigned", date: null },
    { name: "Estimate Submitted", date: null },
    { name: "Estimate Approved", date: null },
    { name: "Work In Progress", date: null },
    { name: "Work Completed", date: null },
    { name: "Payment Processed", date: null },
  ];

  lcItems.forEach((item, i) => {
    const dot = item.querySelector(".lc-dot");
    const nameEl = item.querySelector(".lc-name");
    const dateEl = item.querySelector(".lc-date");
    const existingPill = nameEl?.querySelector(".cur-pill");
    if (existingPill) existingPill.remove();

    dot?.classList.remove("done", "cur");
    nameEl?.classList.remove("dim");

    const stageStep = i + 1;
    if (stageStep < currentStep) {
      dot?.classList.add("done");
      if (nameEl)
        nameEl.textContent = lifecycleStages[i]?.name || nameEl.textContent;
    } else if (stageStep === currentStep) {
      dot?.classList.add("cur");
      if (nameEl) {
        nameEl.textContent = lifecycleStages[i]?.name || nameEl.textContent;
        const pill = document.createElement("span");
        pill.className = "cur-pill";
        pill.textContent = "Current";
        nameEl.appendChild(pill);
      }
      if (dateEl && lifecycleStages[i]?.date)
        dateEl.textContent = lifecycleStages[i].date;
    } else {
      if (nameEl) {
        nameEl.textContent = lifecycleStages[i]?.name || nameEl.textContent;
        nameEl.classList.add("dim");
      }
      if (dateEl) dateEl.textContent = "";
    }
  });

  // ── Description ──
  const descEl = document.querySelector(".desc-text");
  if (descEl) descEl.textContent = c.caption || "No description provided.";

  // ── Photo ──
  const photoWrap = document.querySelector(".photo-wrap");
  if (photoWrap) {
    if (c.image) {
      const img = photoWrap.querySelector("img");
      if (img) img.src = c.image;
      const cap = photoWrap.querySelector(".photo-caption strong");
      const capSmall = photoWrap.querySelector(".photo-caption small");
      if (cap) cap.textContent = c.title;
      if (capSmall)
        capSmall.textContent = `Submitted by ${c.issuedBy || "resident"}`;
    } else {
      photoWrap.innerHTML = `<p style="padding:2rem;text-align:center;color:var(--muted);">No photo attached to this complaint.</p>`;
    }
  }

  // ── Page title ──
  document.title = `PropSync – ${c.title}`;
  const hdrTitle = document.querySelector(".hdr-title");
  if (hdrTitle) hdrTitle.textContent = c.title;
}

// Run on detail page (only if the stepper element exists)
if (document.querySelector(".stepper")) {
  loadComplaintDetails();
}
