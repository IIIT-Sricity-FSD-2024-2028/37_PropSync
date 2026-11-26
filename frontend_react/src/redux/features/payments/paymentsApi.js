// =============================================================
// Payments – backend calls used by paymentsSlice.js
// Backend: backend/src/modules/payments/payments.controller.ts
//
//   GET    /payments?ownerId=        Manager, Admin
//   GET    /payments/owner/:ownerId  Owner, Manager, Admin
//   GET    /payments/:id             Owner, Manager, Admin
//   POST   /payments                 Owner      { billId, ownerId, amount, receiptImage? }
//   DELETE /payments/:id             Admin
//   (the backend has no update endpoint for payments)
// =============================================================

import { authHeaders, request } from "../../apiClient";

// ---------- READ ----------
export const getPayments = ({ ownerId, auth } = {}) =>
  request(`/payments${ownerId ? `?ownerId=${ownerId}` : ""}`, { headers: authHeaders(auth) });

export const getPaymentsByOwner = ({ ownerId, auth }) =>
  request(`/payments/owner/${ownerId}`, { headers: authHeaders(auth) });

export const getPaymentById = ({ id, auth }) =>
  request(`/payments/${id}`, { headers: authHeaders(auth) });

// ---------- CREATE ----------
export const postPayment = ({ payment, auth }) =>
  request(`/payments`, {
    method: "POST",
    headers: authHeaders(auth, true),
    body: JSON.stringify({
      billId: Number(payment.billId),
      ownerId: Number(payment.ownerId),
      amount: Number(payment.amount),
      ...(payment.receiptImage ? { receiptImage: payment.receiptImage } : {}),
    }),
  });

// ---------- DELETE ----------
export const deletePaymentById = ({ id, auth }) =>
  request(`/payments/${id}`, { method: "DELETE", headers: authHeaders(auth) });
