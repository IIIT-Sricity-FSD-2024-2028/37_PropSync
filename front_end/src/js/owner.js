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
