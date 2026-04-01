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
          <a href="${p.receipt}" target="_blank">
            View
          </a>
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
      n.status === "read" ? "notification_card read" : "notification_card";

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

//Complaint details Page
const complaintCards = comp_container.querySelectorAll(".complaint-card");
console.log(complaintCards);
complaintCards.forEach((complaint) => {
  complaint.addEventListener("click", () => {
    window.location.href = "../owner/complaint_details.html";
    const values = document.querySelectorAll("info-val");
    values[0] = complaint.title;
    values[1] = complaint.category;
    values[2] = complaint.id;
    values[3] = complaint.issuedBy;
    values[4] = complaint.status;
  });
});
