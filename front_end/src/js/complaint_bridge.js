/**
 * complaint_bridge.js
 * ─────────────────────────────────────────────────────────────────────
 * Single source-of-truth bridge for the complaint workflow:
 *
 *   Owner  →  submits complaint  →  BRIDGE_KEY (localStorage)
 *   Manager reads BRIDGE_KEY, sees all owner complaints, can Approve / Reject
 *   On Approve  →  complaint moves into the Service Provider's available list
 *   Service Provider sees only manager-approved complaints
 *
 * Storage key: "propSync_bridge"   (array of BridgeComplaint objects)
 * ─────────────────────────────────────────────────────────────────────
 */

const BRIDGE_KEY = "propSync_bridge";

/* ── BridgeComplaint shape ──────────────────────────────────────────
{
  id:             string,           // e.g. "1717000000000" or "C-2410"
  title:          string,
  caption:        string,           // owner's description
  category:       string,           // e.g. "Plumbing"
  status:         "pending" | "approved" | "rejected",
  issuedBy:       string,           // owner email
  image:          string,           // base64 or ""
  submittedOn:    ISO date string,
  rejectionReason: string | "",
  managerApprovedAt: string | null, // ISO date
  spAccepted:     boolean,          // service provider accepted?
}
─────────────────────────────────────────────────────────────────── */

function bridgeGetAll() {
  try {
    return JSON.parse(localStorage.getItem(BRIDGE_KEY)) || [];
  } catch {
    return [];
  }
}

function bridgeSaveAll(list) {
  localStorage.setItem(BRIDGE_KEY, JSON.stringify(list));
}

/* Called by Owner when submitting a new complaint */
function bridgeAddComplaint(complaint) {
  const list = bridgeGetAll();
  const entry = {
    id: String(complaint.id),
    title: complaint.title || "",
    caption: complaint.caption || "",
    category: complaint.category || "General",
    status: "pending",
    issuedBy: complaint.issuedBy || "unknown",
    image: complaint.image || "",
    submittedOn: new Date().toISOString().split("T")[0],
    rejectionReason: "",
    managerApprovedAt: null,
    spAccepted: false,
    location: complaint.location || "Property",
    urgency: complaint.urgency || complaint.priority || "Medium",
    deadline: complaint.deadline || "",
  };
  list.push(entry);
  bridgeSaveAll(list);
}

/* Called by Manager to approve */
function bridgeApproveComplaint(id) {
  const list = bridgeGetAll();
  const c = list.find((x) => x.id === String(id));
  if (c) {
    c.status = "approved";
    c.managerApprovedAt = new Date().toISOString();
    bridgeSaveAll(list);
    _bridgePushToServiceProvider(c);
  }
}

/* Called by Manager to reject */
function bridgeRejectComplaint(id, reason) {
  const list = bridgeGetAll();
  const c = list.find((x) => x.id === String(id));
  if (c) {
    c.status = "rejected";
    c.rejectionReason = reason || "";
    bridgeSaveAll(list);
  }
}

/* Push an approved complaint into the Service Provider's complaints store */
function _bridgePushToServiceProvider(bridgeComplaint) {
  const SP_KEY = "propSyncComplaints";
  let spList = [];
  try {
    spList = JSON.parse(localStorage.getItem(SP_KEY)) || [];
  } catch {
    spList = [];
  }

  // Avoid duplicates
  if (spList.find((x) => x.id === bridgeComplaint.id)) return;

  const spEntry = {
    id: bridgeComplaint.id,
    issueType: bridgeComplaint.category,
    title: bridgeComplaint.title,
    description: bridgeComplaint.caption,
    imageUrl: bridgeComplaint.image || "https://placehold.co/400x180/e5e7eb/6b7280?text=No+Image",
    location: bridgeComplaint.location || "Property",
    deadline: bridgeComplaint.deadline || "TBD",
    urgency: bridgeComplaint.urgency || "Medium",
    accepted: false,
    rejected: false,
    fromOwner: true,
    submittedBy: bridgeComplaint.issuedBy,
  };

  spList.push(spEntry);
  localStorage.setItem(SP_KEY, JSON.stringify(spList));
}

/* Returns only owner-submitted complaints (pending/approved/rejected) for Manager view */
function bridgeGetOwnerComplaints() {
  return bridgeGetAll();
}

/* Returns only manager-approved complaints for Owner status tracking */
function bridgeGetApprovedForOwner() {
  return bridgeGetAll().filter((c) => c.status === "approved");
}

/* Sync: also update the owner's own localStorage newComplaint status */
function bridgeSyncOwnerStatus() {
  const bridge = bridgeGetAll();
  let ownerComplaints = [];
  try {
    ownerComplaints = JSON.parse(localStorage.getItem("newComplaint")) || [];
  } catch {
    ownerComplaints = [];
  }

  let changed = false;
  ownerComplaints.forEach((oc) => {
    const bc = bridge.find((b) => String(b.id) === String(oc.id));
    if (bc && bc.status !== "pending") {
      const map = { approved: "approved", rejected: "rejected" };
      if (oc.status !== map[bc.status]) {
        oc.status = map[bc.status];
        changed = true;
      }
    }
  });

  if (changed) {
    localStorage.setItem("newComplaint", JSON.stringify(ownerComplaints));
  }
}
