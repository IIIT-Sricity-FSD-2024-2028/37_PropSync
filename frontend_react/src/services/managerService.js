// =============================================================
// Maintenance Manager – API service
// All backend calls used by the Maintenance Manager pages live here.
// (Notifications calls come from the shared notificationService.js)
// =============================================================

import { API_BASE_URL } from "./api";
export { API_BASE_URL };

/* ---------- current user (set by LoginSignup in localStorage) ---------- */
export function getCurrentManager() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || {};
  } catch {
    return {};
  }
}

export function getManagerId() {
  const id = Number(getCurrentManager().id);
  return Number.isInteger(id) && id > 0 ? id : 5; // 5 = seeded manager (Vijay Singh)
}

function headers(json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    role: "maintenance_manager",
    "x-user-id": String(getManagerId()),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json().catch(() => ({}));
}

/* ---------- label maps & helpers ---------- */
export const STATUS_LABEL = {
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
  payment_pending: "Payment Pending",
  resolved: "Resolved",
};

export const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High" };

export const OWNER_DIRECTORY = {
  1: { name: "Raj Kumar", email: "raj.owner@propsync.com", unit: "A-101" },
  2: { name: "Anita Sharma", email: "anita.owner@propsync.com", unit: "B-202" },
  3: { name: "Karan Mehta", email: "karan.owner@propsync.com", unit: "C-303" },
  4: { name: "Priya Nair", email: "priya.owner@propsync.com", unit: "D-404" },
};

export function getOwnerDisplay(ownerId) {
  return (
    OWNER_DIRECTORY[Number(ownerId)] || {
      name: `Owner #${ownerId || "-"}`,
      email: "",
      unit: "-",
    }
  );
}

export function toApiImageUrl(photo) {
  if (!photo || /^(https?:|data:)/i.test(photo)) return photo;
  return `${API_BASE_URL}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

export const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const rupees = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
// local date as YYYY-MM-DD (toISOString() would give the UTC date)
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Backend complaint -> shape used by the manager tables */
export function mapComplaint(c) {
  const owner = getOwnerDisplay(c.ownerId);
  return {
    raw: c,
    id: String(c.id),
    issue: c.title,
    description: c.description || "",
    photo: toApiImageUrl(c.photo) || "",
    location: c.location || "Property",
    priority:
      PRIORITY_LABEL[String(c.priority || "").toLowerCase()] ||
      c.priority ||
      "Medium",
    status: STATUS_LABEL[c.status] || c.status,
    subStatus:
      c.status === "approved" && c.interestedProviders?.length
        ? "Waiting Provider Response"
        : "",
    interestedProviders: c.interestedProviders || [],
    submitted: c.submittedAt ? c.submittedAt.split("T")[0] : "—",
    deadline: c.deadline || "",
    assignedProviderId: c.assignedProviderId,
    provider: c.assignedProviderId ? `Provider #${c.assignedProviderId}` : "",
    ownerId: c.ownerId,
    submittedBy: `${owner.name} (${owner.unit})`,
    rejectionReason: c.rejectionReason || "",
  };
}

/* ================= COMPLAINTS ================= */
export const fetchComplaints = () =>
  request(`/complaints?managerId=${getManagerId()}`, { headers: headers() });

export const fetchComplaint = (id) =>
  request(`/complaints/${id}`, { headers: headers() });

export const updateComplaintStatus = (id, body) =>
  request(`/complaints/${id}/status`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify(body),
  });

export const approveComplaint = (id, deadline) =>
  updateComplaintStatus(id, { status: "approved", deadline });

export const rejectComplaint = (id, rejectionReason) =>
  updateComplaintStatus(id, { status: "rejected", rejectionReason });

export const fetchProviderQueue = (id) =>
  request(`/complaints/${id}/queue`, { headers: headers() });

export const assignProvider = (complaintId, providerId) =>
  request(`/complaints/${complaintId}/assign/${providerId}`, {
    method: "PATCH",
    headers: headers(true),
  });

/* ================= PROVIDERS ================= */
export const fetchProviders = () =>
  request(`/users?role=service_provider`, { headers: headers() });

// backend UpdateUserDto accepts: name, phone, propertyUnit, communityName, block
export const updateManagerProfile = (dto) =>
  request(`/users/${getManagerId()}`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify(dto),
  });

/* ================= RATINGS (owner feedback) ================= */
export const fetchRatings = () => request(`/ratings`, { headers: headers() });

/* ================= ESTIMATES ================= */
export const fetchEstimates = (complaintId) =>
  request(`/estimates${complaintId ? `?complaintId=${complaintId}` : ""}`, {
    headers: headers(),
  });

export const reviewEstimate = (estimateId, approved, managerNote) =>
  request(`/estimates/${estimateId}/review`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify(
      approved ? { approved: true } : { approved: false, managerNote }
    ),
  });

/* ================= BILLS ================= */
export const fetchBills = () => request(`/bills`, { headers: headers() });

export const markBillPaid = (billId) =>
  request(`/bills/${billId}/mark-paid`, {
    method: "PATCH",
    headers: headers(true),
  });

/* ================= MONTHLY MAINTENANCE ================= */
export const fetchMaintenancePayments = () =>
  request(`/maintenance`, { headers: headers() });

export const createMaintenanceCharges = (month, amount) =>
  request(`/maintenance/create`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ month, amount }),
  });

export const markMaintenancePaid = (id) =>
  request(`/maintenance/${id}/mark-paid`, {
    method: "PATCH",
    headers: headers(true),
  });

export const settlePlatformFees = () =>
  request(`/maintenance/settle-fee`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ managerId: getManagerId() }),
  });

export const deleteMaintenancePayment = (id) =>
  request(`/maintenance/${id}`, { method: "DELETE", headers: headers(true) });
