const menuBtn = document.querySelector(".menu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

/* OPEN */
menuBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

/* CLOSE (X button) */
closeBtn.addEventListener("click", closeSidebar);

/* CLOSE (click outside) */
overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

document.getElementById("addBtn").addEventListener("click", () => {
  window.location.href = "new-complaint.html";
});

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    // remove active from all
    navItems.forEach((i) => i.classList.remove("active"));

    // add to clicked
    item.classList.add("active");
  });
});

const complaints = [
  {
    title: "Leaking Faucet in Play area",
    desc: "Water leaking continuously",
    status: "inprogress",
  },
  {
    title: "Broken Elevator",
    desc: "Elevator not working",
    status: "approved",
  },
  {
    title: "Garbage Overflow",
    desc: "Garbage not cleaned",
    status: "resolved",
  },
  {
    title: "Parking Light Not Working",
    desc: "Light issue at night",
    status: "waiting",
  },
];

const list = document.getElementById("complaintList");
const search = document.getElementById("search");
const notif = document.getElementById("notifications");

/* LOAD COMPLAINTS */
function loadComplaints(data) {
  list.innerHTML = "";

  data.forEach((c) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <h3>${c.title} 
        <span class="status ${c.status}">${c.status}</span>
      </h3>
      <p>${c.desc}</p>
    `;

    list.appendChild(div);
  });
}

loadComplaints(complaints);

/* SEARCH */
search.addEventListener("input", () => {
  const value = search.value.toLowerCase();

  const filtered = complaints.filter((c) =>
    c.title.toLowerCase().includes(value),
  );

  loadComplaints(filtered);
});

/* ADD COMPLAINT */
document.getElementById("addBtn").addEventListener("click", () => {
  const title = prompt("Enter complaint title:");
  const desc = prompt("Enter description:");

  if (title && desc) {
    complaints.push({
      title,
      desc,
      status: "waiting",
    });

    loadComplaints(complaints);
  }
});

/* NOTIFICATIONS */
const notifications = ["New complaint assigned", "Estimate approved"];

notifications.forEach((n) => {
  const li = document.createElement("li");
  li.textContent = n;
  notif.appendChild(li);
});
