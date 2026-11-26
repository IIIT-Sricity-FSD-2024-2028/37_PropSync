// =============================================================
// Bills – backend calls used by billsSlice.js
// Backend: backend/src/modules/bills/bills.controller.ts
//
//   GET    /bills?complaintId=        Manager, Owner, Admin
//   GET    /bills/:id                 Manager, Owner, Admin
//   GET    /bills/provider/:id/paid   Service Provider
//   POST   /bills  (multipart)        Service Provider
//   PATCH  /bills/:id/mark-paid       Manager, Admin
//   DELETE /bills/:id                 Admin
// =============================================================

import { authHeaders, request } from "../../apiClient";

// ---------- READ ----------
export const getBills = ({ complaintId, auth } = {}) =>
  request(`/bills${complaintId ? `?complaintId=${complaintId}` : ""}`, { headers: authHeaders(auth) });

export const getBillById = ({ id, auth }) =>
  request(`/bills/${id}`, { headers: authHeaders(auth) });

export const getPaidBillsByProvider = ({ providerId, auth }) =>
  request(`/bills/provider/${providerId}/paid`, {
    headers: authHeaders({ role: "service_provider", userId: providerId, ...auth }),
  });

// ---------- CREATE ----------
// formData: complaintId, amount, description, attachments (files).
// No Content-Type header: the browser sets the multipart boundary itself.
export const postBill = ({ formData, auth }) =>
  request(`/bills`, { method: "POST", headers: authHeaders(auth), body: formData });

// ---------- UPDATE ----------
export const patchBillPaid = ({ id, auth }) =>
  request(`/bills/${id}/mark-paid`, { method: "PATCH", headers: authHeaders(auth, true) });

// ---------- DELETE ----------
export const deleteBillById = ({ id, auth }) =>
  request(`/bills/${id}`, { method: "DELETE", headers: authHeaders(auth) });
