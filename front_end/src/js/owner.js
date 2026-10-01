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
    return JSON.parse(localStorage.getItem(`ownerProfile:${user.email}`)) || null;
  } catch {
    return null;
  }
}

function updateOwnerIdentityChrome() {
  const user = getOwnerIdentity();
  const profile = getOwnerProfileIdentity(user) || {};
  const fullName = profile.name || user.name || "Property Owner";
  const unit = profile.unit || user.propertyUnit || "A-101";
  const community = profile.community || user.communityName || "Green Valley Society";

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
  const community = profile.community || user.communityName || "Community not set";
  display.textContent = `${unit} | ${community}`;
}

document.addEventListener("DOMContentLoaded", updateComplaintProfileLocation);

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase().replace(/_/g, " ");
}

function displayStatus(status) {
  const normalized = normalizeStatus(status);
  return {
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
  }[normalized] || status || "Pending";
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
    
    const response = await fetch(`http://localhost:3000/complaints/owner/${ownerId}`, {
      headers: { "role": "owner" }
    });
    
    if (response.ok) {
      complaints = await response.json();
      // Map API fields to frontend expectations if needed
      complaints = complaints.map(c => ({
        ...c,
        caption: c.description,
        image: c.photo
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

const comp_container = document.querySelector(".complaint-cards-list") || document.querySelector(".complaints-container");

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
  const approved = data.filter(c => ["approved", "assigned", "estimating cost", "in progress", "completed", "billed", "paid", "closed", "payment pending", "resolved"].includes(normalizeStatus(c.status))).length;
  const inProgress = data.filter(c => ["assigned", "estimating cost", "in progress", "completed", "billed"].includes(normalizeStatus(c.status))).length;
  const resolved = data.filter(c => ["paid", "closed", "payment pending", "resolved"].includes(normalizeStatus(c.status))).length;
  cards[0].textContent = total;
  cards[1].textContent = approved;
  cards[2].textContent = inProgress;
  cards[3].textContent = resolved;
}

const search = document.querySelector(".search-box");
const statusFilter = document.querySelector(".status-filter");

function applyFilters() {
  if (!search || !statusFilter) { loadComplaints(complaints); return; }
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

    const currentUser =
      JSON.parse(localStorage.getItem("currentUser")) || {};

    // Validate image size — maximum 5MB
    if (file && file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    // Create multipart/form-data
    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", caption);
    formData.append("category", category);
    formData.append("priority", priority);
    formData.append(
      "ownerId",
      String(currentUser.id || 1)
    );

    // Add actual image file
    if (file) {
      formData.append("photo", file);
    }

    try {
      const response = await fetch(
        "http://localhost:3000/complaints",
        {
          method: "POST",

          headers: {
            // DO NOT set Content-Type here.
            // Browser automatically sets multipart/form-data
            // with the correct boundary.
            role: "owner",
          },

          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Complaint created:", data);

        alert("Complaint submitted successfully!");

        window.location.href =
          "../owner/dashboard.html";
      } else {
        console.error("Complaint submission failed:", data);

        alert(
          data.message ||
            "Failed to submit complaint."
        );
      }
    } catch (error) {
      console.error(
        "Error submitting complaint:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    }
  });
}

function deleteComplaint(id) {
  fetch(`http://localhost:3000/complaints/${id}`, {
    method: "DELETE",
    headers: { "role": "admin" }
  }).then(() => fetchComplaint());
}

// ─────────────────────────────────────────────
// MAINTENANCE PAYMENTS & HISTORY
// ─────────────────────────────────────────────
let ownerPaymentsList = [];
let activePaymentForModal = null;

async function fetchPayments() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const ownerId = currentUser.id || 1;

    // Fetch summary
    try {
      const summaryResponse = await fetch(`http://localhost:3000/maintenance/owner/${ownerId}/summary`, {
        headers: { "role": "owner" }
      });
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        const totalPaidEl = document.getElementById("totalPaid");
        const pendingCountEl = document.getElementById("pendingCount");
        const monthlyPaidEl = document.getElementById("monthlyPaid");
        if (totalPaidEl) totalPaidEl.textContent = `₹${Number(summary.totalPaid || 0).toLocaleString('en-IN')}`;
        if (pendingCountEl) pendingCountEl.textContent = summary.pendingCount || 0;
        if (monthlyPaidEl) monthlyPaidEl.textContent = `₹${Number(summary.monthlyPaid || 0).toLocaleString('en-IN')}`;
      }
    } catch (e) {
      console.warn("Could not fetch summary:", e);
    }

    // Fetch payments
    const response = await fetch(`http://localhost:3000/maintenance/owner/${ownerId}`, {
      headers: { "role": "owner" }
    });
    
    if (response.ok) {
      ownerPaymentsList = await response.json();
      renderOwnerPayments(ownerPaymentsList);
    } else {
      renderOwnerPayments([]);
    }
  } catch (error) {
    console.log("Error loading payments:", error);
    renderOwnerPayments([]);
  }
}

// Auto-fetch on page load if table exists
if (document.getElementById("ownerPaymentRows") || document.querySelector(".payments")) {
  fetchPayments();
}

function updateProgressOverview(payments) {
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAmount = totalPaid + totalPending;

  const pct = totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(1) : '0.0';

  const pctEl = document.getElementById('collectedPctText');
  const fillEl = document.getElementById('paymentProgressFill');
  const paidTextEl = document.getElementById('paidAmountProgressText');
  const pendingTextEl = document.getElementById('pendingAmountProgressText');

  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (paidTextEl) paidTextEl.textContent = `₹${totalPaid.toLocaleString('en-IN')} Paid`;
  if (pendingTextEl) pendingTextEl.textContent = `₹${totalPending.toLocaleString('en-IN')} Pending`;
}

function renderOwnerPayments(data) {
  updateProgressOverview(ownerPaymentsList);

  const tbody = document.getElementById("ownerPaymentRows");
  if (!tbody) {
    // Fallback for legacy layout if present
    loadLegacyPayments(data);
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">
          No maintenance payment records found.
        </td>
      </tr>
    `;
    return;
  }

  const currentUser = getOwnerIdentity();
  const userUnit = currentUser.propertyUnit || "A-101";

  tbody.innerHTML = data.map(p => {
    const isPaid = p.status === 'paid';
    const isSubmitted = p.status === 'payment_submitted';
    const hasTxn = Boolean(p.transactionId && p.transactionId.trim());
    const unitDisplay = p.ownerUnit ? `Unit ${p.ownerUnit}` : `Unit ${userUnit}`;
    const paidOnDisplay = p.paidAt
      ? new Date(p.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
      : '-';

    let statusHtml = '';
    if (isPaid) {
      statusHtml = `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:#dcfce7;color:#15803d;">Paid</span>`;
    } else if (isSubmitted) {
      statusHtml = `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:#e0f2fe;color:#0369a1;">Payment Submitted / Awaiting Confirmation</span>`;
    } else {
      statusHtml = `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:#fef3c7;color:#b45309;">Pending</span>`;
    }

    let actionHtml = '';
    if (p.status === 'pending' && !hasTxn) {
      actionHtml = `<button type="button" class="btn btn-green" style="padding:6px 14px;font-size:13px;border-radius:6px;font-weight:600;cursor:pointer;" onclick="openConfirmPaymentModal(${p.id}, '${p.month}', ${p.amount})">Pay Now</button>`;
    } else if (isPaid) {
      actionHtml = `<span style="color:#16a34a;font-weight:600;font-size:13px;">-</span>`;
    } else {
      actionHtml = `<span style="color:#64748b;font-size:13px;">-</span>`;
    }

    return `
      <tr style="border-bottom:1px solid #f1f5f9;transition:background 0.15s ease;">
        <td style="padding:14px 16px;font-weight:600;color:#1e293b;">${unitDisplay}</td>
        <td style="padding:14px 16px;color:#475569;">${p.month}</td>
        <td style="padding:14px 16px;font-weight:700;color:#1e293b;">₹${Number(p.amount || 0).toLocaleString('en-IN')}</td>
        <td style="padding:14px 16px;">${statusHtml}</td>
        <td style="padding:14px 16px;color:#64748b;">${paidOnDisplay}</td>
        <td style="padding:14px 16px;font-family:monospace;font-weight:${isSubmitted || isPaid ? '600' : '400'};color:#1e293b;font-size:13px;">${p.transactionId || '-'}</td>
        <td style="padding:14px 16px;">${actionHtml}</td>
      </tr>
    `;
  }).join('');
}

function filterOwnerPayments() {
  const searchInput = document.getElementById("ownerSearchInput");
  const statusFilter = document.getElementById("ownerStatusFilter");
  
  const term = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const status = (statusFilter ? statusFilter.value : 'all').toLowerCase().trim();

  let filtered = ownerPaymentsList.filter(p => {
    const matchesSearch = !term ||
      String(p.transactionId || '').toLowerCase().includes(term) ||
      String(p.month || '').toLowerCase().includes(term);

    let matchesStatus = true;
    if (status === 'pending') {
      matchesStatus = p.status === 'pending';
    } else if (status === 'payment_submitted') {
      matchesStatus = p.status === 'payment_submitted';
    } else if (status === 'paid') {
      matchesStatus = p.status === 'paid';
    }
    return matchesSearch && matchesStatus;
  });

  renderOwnerPayments(filtered);
}

function clearOwnerFilters() {
  const searchInput = document.getElementById("ownerSearchInput");
  const statusFilter = document.getElementById("ownerStatusFilter");
  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'all';
  renderOwnerPayments(ownerPaymentsList);
}

// ─────────────────────────────────────────────
// PAYMENT MODALS LOGIC
// ─────────────────────────────────────────────
function openConfirmPaymentModal(id, month, amount) {
  activePaymentForModal = { id, month, amount };
  const monthEl = document.getElementById("confirmModalMonth");
  const amountEl = document.getElementById("confirmModalAmount");
  if (monthEl) monthEl.textContent = month;
  if (amountEl) amountEl.textContent = `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const modal = document.getElementById("confirmPaymentModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeConfirmModal() {
  const modal = document.getElementById("confirmPaymentModal");
  if (modal) modal.style.display = "none";
}

function proceedToScanModal() {
  closeConfirmModal();
  const modal = document.getElementById("scanToPayModal");
  const input = document.getElementById("ownerTxnIdInput");
  const err = document.getElementById("ownerTxnError");
  if (input) input.value = "";
  if (err) err.style.display = "none";
  if (modal) modal.style.display = "flex";
}

function closeScanModal() {
  const modal = document.getElementById("scanToPayModal");
  if (modal) modal.style.display = "none";
}

async function submitOwnerTransactionProof() {
  if (!activePaymentForModal) return;
  const input = document.getElementById("ownerTxnIdInput");
  const err = document.getElementById("ownerTxnError");
  const txnId = input ? input.value.trim() : "";

  if (!txnId) {
    if (err) {
      err.textContent = "Please enter a valid Transaction ID.";
      err.style.display = "block";
    } else {
      alert("Please enter a valid Transaction ID.");
    }
    return;
  }

  const btn = document.getElementById("submitTxnBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting...";
  }

  try {
    const res = await fetch(`http://localhost:3000/maintenance/${activePaymentForModal.id}/submit-transaction`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "role": "owner",
      },
      body: JSON.stringify({ transactionId: txnId }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || "Failed to submit transaction ID.");
    }

    closeScanModal();
    alert("Transaction submitted successfully! Waiting for Maintenance Manager approval.");
    fetchPayments();
  } catch (error) {
    if (err) {
      err.textContent = error.message || "Error submitting transaction.";
      err.style.display = "block";
    } else {
      alert(error.message || "Error submitting transaction.");
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Submit Transaction";
    }
  }
}

function loadLegacyPayments(data) {
  const legacyContainer = document.querySelector(".payments");
  if (!legacyContainer) return;
  legacyContainer.innerHTML = "";

  if (!data || data.length === 0) {
    legacyContainer.innerHTML = "<p>No maintenance charges found.</p>";
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
      <p class="amount">
        <b>Transaction ID:</b> ${p.transactionId || "—"}
      </p>
      ${
        p.status === "paid"
          ? `<p class="success conform">Payment completed</p>`
          : !p.transactionId
          ? `<button type="button" onclick="openConfirmPaymentModal(${p.id}, '${p.month}', ${p.amount})" style="margin-top:10px;background:#16a34a;color:white;border:none;border-radius:8px;padding:9px 14px;font-weight:700;cursor:pointer;">Pay Now</button>`
          : `<p style="color:#d97706;font-size:13px;margin-top:6px;font-weight:600;">Submitted (Pending approval)</p>`
      }
    `;
    legacyContainer.append(div);
  });
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
    
    const response = await fetch(`http://localhost:3000/notifications?userId=${ownerId}`, {
      headers: { "role": "owner" }
    });
    
    if (response.ok) {
      notifications = await response.json();
      renderDashboardNotifications(notifications);
      loadNotifications(notifications);
    }
  } catch (error) {
    console.log("Error loading notifications:", error);
  }
}

function renderDashboardNotifications(data) {
  const card = document.querySelector('.mid .box-large');
  if (!card) return;
  const recent = (data || []).slice(0, 3);
  card.innerHTML = `
    <div class="box-header">
      <h3>Notifications <span class="badge">${recent.filter(n => n.status === 'unread').length}</span></h3>
      <a href="./alerts.html" class="view-all">View All →</a>
    </div>
    ${recent.length ? recent.map(n => `
      <div class="item">
        <div class="icon ${n.status === 'unread' ? 'yellow' : 'green'}">${n.status === 'unread' ? '!' : '✓'}</div>
        <div>
          <p class="title">${n.title || 'Notification'}</p>
          <p class="desc">${n.message || 'You have a new update.'}</p>
          <span class="time">${n.time || n.createdAt || 'Just now'}</span>
        </div>
      </div>`).join('') : '<p class="desc">No notifications yet.</p>'}`;
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
      headers: { "role": "owner" }
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
      headers: { "role": "owner" }
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
      { headers: { "role": "owner" } },
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
    const checked = form.querySelector('input[name="owner-rating-score"]:checked');
    const score = Number(checked?.value || 5);

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await fetch("http://localhost:3000/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "role": "owner",
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
      headers: { "role": "owner" }
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
    completed: "Service provider marked the work as completed and submitted a bill.",
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
      paid:
        "background:var(--green-lt);color:var(--green);border-color:rgba(22,163,74,.25)",
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
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:50px;'>Error loading complaint details.</h2>";
  }
}

// Run on detail page (only if the stepper element exists)
if (document.querySelector(".stepper")) {
  loadComplaintDetails();
  // ✅ Poll every 15 seconds so status updates from manager appear without manual refresh
  setInterval(loadComplaintDetails, 15000);
}
