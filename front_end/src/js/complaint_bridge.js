/**
 * complaint_bridge.js
 * ─────────────────────────────────────────────────────────────────────
 * Now uses the backend NestJS API instead of localStorage.
 * ─────────────────────────────────────────────────────────────────────
 */

const BRIDGE_API_BASE = "http://localhost:3000";

// A mock maintenance manager header since we don't have auth yet
const MANAGER_HEADERS = {
  "Content-Type": "application/json",
  "role": "maintenance_manager",
  "user-email": "manager@example.com"
};

const OWNER_HEADERS = {
  "Content-Type": "application/json",
  "role": "owner",
  "user-email": "owner@example.com"
};

async function bridgeGetAll() {
  try {
    const res = await fetch(`${BRIDGE_API_BASE}/complaints`, { headers: MANAGER_HEADERS });
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

/* Called by Owner when submitting a new complaint */
async function bridgeAddComplaint(complaint) {
  try {
    await fetch(`${BRIDGE_API_BASE}/complaints`, {
      method: "POST",
      headers: OWNER_HEADERS,
      body: JSON.stringify({
        title: complaint.title || "",
        description: complaint.caption || "",
        category: complaint.category || "General",
        priority: complaint.urgency || complaint.priority || "Medium",
        location: complaint.location || "Property",
        issuedBy: complaint.issuedBy || "owner@example.com",
        image: complaint.image || "",
        deadline: complaint.deadline || "",
      })
    });
  } catch (err) {
    console.error(err);
  }
}

/* Called by Manager to approve */
async function bridgeApproveComplaint(id) {
  try {
    await fetch(`${BRIDGE_API_BASE}/complaints/${id}/approved`, {
      method: "PATCH",
      headers: MANAGER_HEADERS
    });
  } catch (err) {
    console.error(err);
  }
}

/* Called by Manager to reject */
async function bridgeRejectComplaint(id, reason) {
  try {
    await fetch(`${BRIDGE_API_BASE}/complaints/${id}/rejected`, {
      method: "PATCH",
      headers: MANAGER_HEADERS,
      body: JSON.stringify({ reason })
    });
  } catch (err) {
    console.error(err);
  }
}

/* Returns only owner-submitted complaints (pending/approved/rejected) for Manager view */
async function bridgeGetOwnerComplaints() {
  const all = await bridgeGetAll();
  // Filter for those actually submitted by owners, not service provider internal ones
  return all.filter(c => c.issuedBy && c.issuedBy.includes("@"));
}

/* Returns only manager-approved complaints for Owner status tracking */
async function bridgeGetApprovedForOwner() {
  const all = await bridgeGetAll();
  return all.filter(c => c.status === "Approved" || c.status === "Assigned");
}

/* Sync: also update the owner's own localStorage newComplaint status (legacy) */
async function bridgeSyncOwnerStatus() {
  const bridge = await bridgeGetAll();
  let ownerComplaints = [];
  try {
    ownerComplaints = JSON.parse(localStorage.getItem("newComplaint")) || [];
  } catch {
    ownerComplaints = [];
  }

  let changed = false;
  ownerComplaints.forEach((oc) => {
    const bc = bridge.find((b) => String(b.id) === String(oc.id));
    if (bc && bc.status !== "Pending") {
      if (oc.status !== bc.status.toLowerCase()) {
        oc.status = bc.status.toLowerCase();
        changed = true;
      }
    }
  });

  if (changed) {
    localStorage.setItem("newComplaint", JSON.stringify(ownerComplaints));
  }
}
