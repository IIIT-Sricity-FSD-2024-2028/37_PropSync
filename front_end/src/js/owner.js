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

function getOwnerIdentity() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || {};
  } catch {
    return {};
  }
}

function getOwnerProfileIdentity(user) {
  if (!user.email) return null;
  try {
    return (
      JSON.parse(localStorage.getItem(`ownerProfile:${user.email}`)) || null
    );
  } catch {
    return null;
  }
}

function updateOwnerIdentityChrome() {
  const user = getOwnerIdentity();
  const profile = getOwnerProfileIdentity(user) || {};
  const fullName = profile.name || user.name || "Property Owner";
  const unit = profile.unit || user.propertyUnit || "A-101";
  const community =
    profile.community || user.communityName || "Green Valley Society";

  document.querySelectorAll(".profile .avatar").forEach((avatar) => {
    const svg = avatar.querySelector("svg")?.cloneNode(true);
    avatar.textContent = "";
    if (svg) avatar.appendChild(svg);
    avatar.appendChild(document.createTextNode(fullName));
    avatar.title = fullName;
  });

  const dashboardTitle = document.querySelector(".container > h1");
  if (dashboardTitle && /Welcome Back/i.test(dashboardTitle.textContent)) {
    dashboardTitle.textContent = `Welcome Back, ${fullName}!`;
  }

  const dashboardSub = document.querySelector(".container > .sub");
  if (dashboardSub) dashboardSub.textContent = `${unit} | ${community}`;
}

document.addEventListener("DOMContentLoaded", updateOwnerIdentityChrome);

function updateComplaintProfileLocation() {
  const display = document.getElementById("profile_location_display");
  if (!display) return;

  const user = getOwnerIdentity();
  const profile = getOwnerProfileIdentity(user) || {};
  const unit = profile.unit || user.propertyUnit || "Property unit not set";
  const community =
    profile.community || user.communityName || "Community not set";
  display.textContent = `${unit} | ${community}`;
}

document.addEventListener("DOMContentLoaded", updateComplaintProfileLocation);

function normalizeStatus(status) {
  return String(status || "pending")
    .toLowerCase()
    .replace(/_/g, " ");
}

function displayStatus(status) {
  const normalized = normalizeStatus(status);
  return (
    {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      assigned: "Assigned",
      "estimating cost": "Estimating Cost",
      "in progress": "In Progress",
      completed: "Completed",
      billed: "Billed",
      paid: "Paid",
      closed: "Closed",
      "payment pending": "Payment Pending",
      resolved: "Resolved",
    }[normalized] ||
    status ||
    "Pending"
  );
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
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const ownerId = currentUser.id || 1;

    const response = await fetch(
      `http://localhost:3000/complaints/owner/${ownerId}`,
      {
        headers: { role: "owner" },
      },
    );

    if (response.ok) {
      complaints = await response.json();
      // Map API fields to frontend expectations if needed
      complaints = complaints.map((c) => ({
        ...c,
        caption: c.description,
        image: c.photo,
      }));
      console.log("All complaints:", complaints);
      applyFilters(); // instead of loadComplaints directly to keep filters applied
    }
  } catch (error) {
    console.log("Error loading complaints:", error);
  }
}

fetchComplaint();

// ✅ Poll every 15 seconds to pick up manager approve/reject decisions dynamically
setInterval(fetchComplaint, 15000);

const comp_container =
  document.querySelector(".complaint-cards-list") ||
  document.querySelector(".complaints-container");

function loadComplaints(data) {
  if (!comp_container) return;
  updateOwnerDashboardStats(data || []);

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
    let statusText = c.status || "pending";

    switch (normalizeStatus(c.status)) {
      case "pending":
        statusClass = "pending";
        statusText = "Pending";
        break;
      case "approved":
        statusClass = "approved";
        statusText = "Approved";
        break;
      case "rejected":
        statusClass = "rejected";
        statusText = "Rejected";
        break;
      case "estimating cost":
        statusClass = "estimating";
        statusText = "Estimating Cost";
        break;
      case "in progress":
        statusClass = "estimating";
        statusText = "In Progress";
        break;
      case "completed":
      case "billed":
      case "paid":
      case "closed":
        statusClass = "resolved";
        statusText = displayStatus(c.status);
        break;
      case "assigned":
        statusClass = "assigned";
        statusText = "Assigned";
        break;
      case "resolved":
        statusClass = "resolved";
        statusText = "Resolved";
        break;
    }

    div.innerHTML = `
      ${
        c.image
          ? `<img class="complaint-thumb" src="${c.image}" alt="${c.title}" onerror="this.remove()">`
          : ""
      }
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
        ${statusText}
      </div>
    `;

    comp_container.append(div);
  });
}

function updateOwnerDashboardStats(data) {
  const cards = document.querySelectorAll(".cards-container .cards h2");
  if (!cards.length) return;
  const total = data.length;
  const approved = data.filter((c) =>
    [
      "approved",
      "assigned",
      "estimating cost",
      "in progress",
      "completed",
      "billed",
      "paid",
      "closed",
      "payment pending",
      "resolved",
    ].includes(normalizeStatus(c.status)),
  ).length;
  const inProgress = data.filter((c) =>
    [
      "assigned",
      "estimating cost",
      "in progress",
      "completed",
      "billed",
    ].includes(normalizeStatus(c.status)),
  ).length;
  const resolved = data.filter((c) =>
    ["paid", "closed", "payment pending", "resolved"].includes(
      normalizeStatus(c.status),
    ),
  ).length;
  cards[0].textContent = total;
  cards[1].textContent = approved;
  cards[2].textContent = inProgress;
  cards[3].textContent = resolved;
}

const search = document.querySelector(".search-box");
const statusFilter = document.querySelector(".status-filter");

function applyFilters() {
  if (!search || !statusFilter) {
    loadComplaints(complaints);
    return;
  }
  const searchValue = search.value.toLowerCase();
  const selectedStatus = statusFilter.value.toLowerCase();

  const filtered = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchValue);

    const matchesStatus =
      selectedStatus === "all status" ||
      selectedStatus === "" ||
      normalizeStatus(c.status) === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  loadComplaints(filtered);
}

if (search && statusFilter) {
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
    const priority = document.getElementById("complaint_priority").value;
    const imageInput = document.getElementById("form_image");
    const file = imageInput.files[0];
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const issuedBy = currentUser.email || "unknown@user.com";
    let imageData = "";

    if (file) {
      // Validate image size — max 1.5MB
      if (file.size > 1_500_000) {
        alert("Image is too large. Please select an image under 1.5MB.");
        return;
      }
      imageData = await toBase64(file);
    }

    const complaintPayload = {
      title: title,
      description: caption,
      category: category,
      priority: priority,
      ownerId: currentUser.id || 1,
      photo: imageData,
    };

    try {
      const response = await fetch("http://localhost:3000/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          role: "owner",
        },
        body: JSON.stringify(complaintPayload),
      });
      if (response.ok) {
        alert("Complaint submitted successfully!");
        window.location.href = "../owner/dashboard.html";
      } else {
        alert("Failed to submit complaint.");
      }
    } catch (e) {
      alert("Error submitting complaint.");
    }
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
  fetch(`http://localhost:3000/complaints/${id}`, {
    method: "DELETE",
    headers: { role: "admin" },
  }).then(() => fetchComplaint());
}

//payments history
const container = document.querySelector(".payments");
let payments = [];

async function fetchPayments() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const ownerId = currentUser.id || 1;

    const summaryResponse = await fetch(
      `http://localhost:3000/maintenance/owner/${ownerId}/summary`,
      {
        headers: { role: "owner" },
      },
    );
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      const totalPaidEl = document.getElementById("totalPaid");
      const pendingCountEl = document.getElementById("pendingCount");
      const monthlyPaidEl = document.getElementById("monthlyPaid");
      if (totalPaidEl) totalPaidEl.textContent = `₹${summary.totalPaid}`;
      if (pendingCountEl) pendingCountEl.textContent = summary.pendingCount;
      if (monthlyPaidEl) monthlyPaidEl.textContent = `₹${summary.monthlyPaid}`;
    }

    const response = await fetch(
      `http://localhost:3000/maintenance/owner/${ownerId}`,
      {
        headers: { role: "owner" },
      },
    );

    if (response.ok) {
      payments = await response.json();
      loadPayments(payments);
    }
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

    div.className = "payment";

    div.innerHTML = `
      <div class="row">
        <h3>Bill #${p.billId}</h3>

        <span class="status paid">paid</span>
      </div>

      <p class="amount">
        <b>Amount:</b> ₹${p.amount}
        &nbsp;&nbsp; <b>Paid on:</b> ${formatDate(p.paidAt)}
      </p>

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
    `;

    container.append(div);
  });
}

function loadMaintenancePayments(data) {
  if (!container) return;
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No maintenance charges found.</p>";
    return;
  }

  data.forEach((p) => {
    const div = document.createElement("div");
    div.className = "payment";
    div.innerHTML = `
      <div class="row">
        <h3>${p.month} Maintenance</h3>
        <span class="status ${p.status === "paid" ? "paid" : "pending"}">${p.status}</span>
      </div>
      <p class="amount">
        <b>Amount:</b> ₹${p.amount}
        &nbsp;&nbsp; <b>Paid on:</b> ${p.paidAt ? formatDate(p.paidAt) : "Pending"}
      </p>
      ${
        p.status === "paid"
          ? `<p class="success conform">Payment completed</p>`
          : `<button type="button" onclick="payMaintenance(${p.id})" style="margin-top:10px;background:#16a34a;color:white;border:none;border-radius:8px;padding:9px 14px;font-weight:700;cursor:pointer;">Pay Maintenance</button>`
      }
    `;
    container.append(div);
  });
}

loadPayments = loadMaintenancePayments;

async function payMaintenance(id) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const ownerId = currentUser.id || 1;
  try {
    const response = await fetch(
      `http://localhost:3000/maintenance/${id}/pay?ownerId=${ownerId}`,
      {
        method: "PATCH",
        headers: { role: "owner" },
      },
    );
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || "Failed to pay maintenance");
    }
    alert("Maintenance payment completed.");
    fetchPayments();
  } catch (error) {
    alert(error.message || "Error paying maintenance");
  }
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

async function submitPayment(id) {
  const receipt = tempReceipt[id];

  if (!receipt) {
    alert("Please upload receipt first");
    return;
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const response = await fetch("http://localhost:3000/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        role: "owner",
      },
      body: JSON.stringify({
        billId: id,
        ownerId: currentUser.id || 1,
        amount: payments.find((p) => p.id === id)?.amount || 0,
        receiptImage: receipt,
      }),
    });
    if (response.ok) {
      alert("Payment submitted successfully");
      fetchPayments();
    } else {
      alert("Failed to submit payment");
    }
  } catch (e) {
    alert("Error submitting payment");
  }
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
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const ownerId = currentUser.id || 1;

    const response = await fetch(
      `http://localhost:3000/notifications?userId=${ownerId}`,
      {
        headers: { role: "owner" },
      },
    );

    if (response.ok) {
      notifications = await response.json();
      loadNotifications(notifications);
    }
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

async function markAsRead(id) {
  try {
    await fetch(`http://localhost:3000/notifications/${id}/read`, {
      method: "PATCH",
      headers: { role: "owner" },
    });
    fetchNotifications();
  } catch (e) {
    console.error(e);
  }
}

async function deleteNotification(id) {
  try {
    await fetch(`http://localhost:3000/notifications/${id}`, {
      method: "DELETE",
      headers: { role: "owner" },
    });
    fetchNotifications();
  } catch (e) {
    console.error(e);
  }
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

const RATABLE_STATUSES = new Set([
  "completed",
  "payment pending",
  "resolved",
  "paid",
  "closed",
]);

function isComplaintRatable(status) {
  return RATABLE_STATUSES.has(normalizeStatus(status));
}

async function renderOwnerRating(c, currentStatus) {
  const card = document.getElementById("owner-rating-card");
  const form = document.getElementById("owner-rating-form");
  const state = document.getElementById("owner-rating-state");
  const feedback = document.getElementById("owner-rating-feedback");
  const submitBtn = document.getElementById("owner-rating-submit");

  if (!card || !form || !state || !feedback || !submitBtn) return;

  card.hidden = true;
  state.hidden = true;
  form.hidden = false;

  if (!isComplaintRatable(currentStatus) || !c.assignedProviderId) {
    return;
  }

  card.hidden = false;
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const ownerId = currentUser.id || c.ownerId || 1;
  let existingRating = null;

  try {
    const existingRes = await fetch(
      `http://localhost:3000/ratings?ownerId=${ownerId}&complaintId=${c.id}`,
      { headers: { role: "owner" } },
    );
    if (existingRes.ok) {
      const ratings = await existingRes.json();
      existingRating = ratings[0] || null;
    }
  } catch (error) {
    console.log("Error checking existing rating:", error);
  }

  if (existingRating) {
    form.hidden = true;
    state.hidden = false;
    state.textContent = `You rated this service ${existingRating.score}/5${
      existingRating.feedback ? `: ${existingRating.feedback}` : "."
    }`;
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const checked = form.querySelector(
      'input[name="owner-rating-score"]:checked',
    );
    const score = Number(checked?.value || 5);

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await fetch("http://localhost:3000/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          role: "owner",
        },
        body: JSON.stringify({
          ownerId,
          complaintId: c.id,
          score,
          feedback: feedback.value.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to submit rating");
      }

      const rating = await response.json();
      form.hidden = true;
      state.hidden = false;
      state.textContent = `Thank you. You rated this service ${rating.score}/5${
        rating.feedback ? `: ${rating.feedback}` : "."
      }`;
    } catch (error) {
      alert(error.message || "Error submitting rating");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Rating";
    }
  };
}

// ─────────────────────────────────────────────
// Complaint Details Page — reads ?id= from URL
// ─────────────────────────────────────────────
async function loadComplaintDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  try {
    const response = await fetch(`http://localhost:3000/complaints/${id}`, {
      headers: { role: "owner" },
    });

    if (!response.ok) {
      throw new Error("Not found");
    }

    let c = await response.json();
    c.caption = c.description; // Map API description to frontend caption
    c.image = c.photo; // Map API photo to the detail page image renderer
    c.issuedBy = "Resident"; // Assuming issuedBy since backend stores ownerId
    c.submittedOn = c.submittedAt;

    // ── Helper: map status → stepper step index (1-based) ──
    const statusStepMap = {
      pending: 1,
      rejected: 1,
      approved: 2,
      assigned: 3,
      "estimating cost": 4,
      "in progress": 5,
      completed: 6,
      billed: 6,
      paid: 6,
      closed: 6,
      "payment pending": 6,
      resolved: 6,
    };
    const currentStatus = normalizeStatus(c.status);
    const currentStep = statusStepMap[currentStatus] || 1;

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
    set("detail-location", c.location || "Location not provided");
    set("detail-issuedby", c.issuedBy || "—");

    const workStatusMap = {
      pending: "Waiting for Maintenance Manager to approve…",
      approved: "Complaint approved. Waiting for provider assignment.",
      rejected: c.rejectionReason
        ? `Complaint rejected. Reason: ${c.rejectionReason}`
        : "Complaint was rejected by the Maintenance Manager.",
      assigned: `Assigned to: ${c.assignedTo || "a service provider"}`,
      "estimating cost": "Service provider is submitting cost estimate.",
      "in progress": "Work is currently in progress.",
      completed:
        "Service provider marked the work as completed and submitted a bill.",
      billed: "Service bill submitted. Payment is awaiting manager approval.",
      paid: "Service bill payment has been completed.",
      closed: "Payment completed. Complaint is closed.",
      "payment pending": "Work is completed. Payment is pending.",
      resolved: "Work has been completed and resolved.",
    };
    set(
      "detail-workstatus",
      workStatusMap[currentStatus] || displayStatus(c.status) || "—",
    );

    // Status badge
    set("detail-status-text", displayStatus(c.status));
    const badge = document.getElementById("detail-status-badge");
    if (badge) {
      const statusColorMap = {
        pending:
          "background:var(--amber-lt);color:var(--amber);border-color:rgba(217,119,6,.25)",
        approved:
          "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
        rejected:
          "background:#fee2e2;color:#b91c1c;border-color:rgba(185,28,28,.25)",
        assigned:
          "background:var(--blue-lt);color:var(--blue);border-color:rgba(29,78,216,.25)",
        "estimating cost":
          "background:#f5f3ff;color:#7c3aed;border-color:rgba(124,58,237,.25)",
        "in progress":
          "background:var(--teal-lt);color:var(--teal);border-color:rgba(13,148,136,.25)",
        completed:
          "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
        billed:
          "background:#f5f3ff;color:#7c3aed;border-color:rgba(124,58,237,.25)",
        paid: "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
        closed:
          "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
        "payment pending":
          "background:#f5f3ff;color:#7c3aed;border-color:rgba(124,58,237,.25)",
        resolved:
          "background:#f3f4f6;color:#374151;border-color:rgba(55,65,81,.25)",
      };
      badge.style.cssText = statusColorMap[currentStatus] || "";
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
    const lifecycleStepMap = {
      pending: 1,
      rejected: 1,
      approved: 2,
      assigned: 3,
      "estimating cost": 4,
      "in progress": 6,
      completed: 7,
      billed: 7,
      paid: 8,
      closed: 8,
      "payment pending": 8,
      resolved: 8,
    };
    const lifecycleCurrentStep = lifecycleStepMap[currentStatus] || 1;

    lcItems.forEach((item, i) => {
      const dot = item.querySelector(".lc-dot");
      const nameEl = item.querySelector(".lc-name");
      const dateEl = item.querySelector(".lc-date");
      const existingPill = nameEl?.querySelector(".cur-pill");
      if (existingPill) existingPill.remove();

      dot?.classList.remove("done", "cur");
      nameEl?.classList.remove("dim");

      const stageStep = i + 1;
      if (stageStep < lifecycleCurrentStep) {
        dot?.classList.add("done");
        if (nameEl)
          nameEl.textContent = lifecycleStages[i]?.name || nameEl.textContent;
      } else if (stageStep === lifecycleCurrentStep) {
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
      const imageSrc = c.image || c.photo;
      if (imageSrc) {
        const img = photoWrap.querySelector("img");
        if (img) img.src = imageSrc;
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

    await renderOwnerRating(c, currentStatus);
  } catch (error) {
    console.error("Failed to load complaint details:", error);
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:50px;'>Error loading complaint details.</h2>";
  }
}

// Run on detail page (only if the stepper element exists)
if (document.querySelector(".stepper")) {
  loadComplaintDetails();
  // ✅ Poll every 15 seconds so status updates from manager appear without manual refresh
  setInterval(loadComplaintDetails, 15000);
}
