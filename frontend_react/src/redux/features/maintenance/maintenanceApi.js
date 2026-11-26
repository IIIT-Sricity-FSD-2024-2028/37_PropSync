// =============================================================
// Monthly maintenance – backend calls used by maintenanceSlice.js (Repository/API layer)
// Backend: backend/src/modules/maintenance/maintenance.controller.ts
//
//   POST   /maintenance/create                  { month, amount }
//   GET    /maintenance                         manager / admin / super user list
//   GET    /maintenance/owner/:ownerId          owner list
//   GET    /maintenance/owner/:ownerId/summary  owner totals
//   GET    /maintenance/revenue                 platform revenue
//   PATCH  /maintenance/:id/submit-transaction  { transactionId }
//   PATCH  /maintenance/:id/mark-paid
//   POST   /maintenance/settle-fee              { managerId } or { paymentId }
//   DELETE /maintenance/:id
// =============================================================

import { roleRequest } from "../../../services/roleApi";

const call = (session, path, options = {}) => roleRequest(session.role, session.id, path, options);

export const getMaintenance = ({ session, signal }) =>
  call(session, session.role === "owner" ? `/maintenance/owner/${session.id}` : "/maintenance", { signal });

export const getMaintenanceSummary = ({ session, signal }) =>
  call(session, `/maintenance/owner/${session.id}/summary`, { signal });

export const getMaintenanceRevenue = ({ session, signal }) => call(session, "/maintenance/revenue", { signal });

export const postMaintenanceCharges = ({ session, month, amount }) =>
  call(session, "/maintenance/create", { method: "POST", body: JSON.stringify({ month, amount: Number(amount) }) });

export const patchSubmitTransaction = ({ session, id, transactionId }) =>
  call(session, `/maintenance/${id}/submit-transaction`, { method: "PATCH", body: JSON.stringify({ transactionId }) });

export const patchMarkPaid = ({ session, id }) => call(session, `/maintenance/${id}/mark-paid`, { method: "PATCH" });

export const postSettleFees = ({ session, paymentId }) =>
  call(session, "/maintenance/settle-fee", {
    method: "POST",
    body: JSON.stringify(paymentId ? { paymentId } : { managerId: session.id || undefined }),
  });

export const deleteMaintenanceById = ({ session, id }) => call(session, `/maintenance/${id}`, { method: "DELETE" });
