/**
 * Legacy compatibility bridge.
 *
 * Core complaint workflow now belongs to the NestJS backend:
 * /complaints, /estimates, /bills, /payments, and /ratings.
 * These no-op helpers remain only so older pages that still include this
 * script do not fail while those pages are migrated.
 */

function bridgeGetAll() {
  return [];
}

function bridgeSaveAll() {}

function bridgeAddComplaint(complaint) {
  console.warn(
    "bridgeAddComplaint is deprecated. Use POST /complaints instead.",
    complaint,
  );
}

function bridgeApproveComplaint(id) {
  console.warn(
    "bridgeApproveComplaint is deprecated. Use PATCH /complaints/:id/status instead.",
    id,
  );
}

function bridgeRejectComplaint(id, reason) {
  console.warn(
    "bridgeRejectComplaint is deprecated. Use PATCH /complaints/:id/status instead.",
    id,
    reason,
  );
}

function bridgeGetOwnerComplaints() {
  return [];
}

function bridgeGetApprovedForOwner() {
  return [];
}

function bridgeSyncOwnerStatus() {}
