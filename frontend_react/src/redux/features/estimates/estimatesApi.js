// =============================================================
// Service estimates – backend calls used by estimatesSlice.js (Repository/API layer)
// Backend: backend/src/modules/estimates/estimates.controller.ts
//
//   GET    /estimates[?complaintId=]         list
//   GET    /estimates/provider/:providerId   a provider's estimates
//   GET    /estimates/:id                    one estimate
//   POST   /estimates   (multipart: document) create (Service Provider)
//   PATCH  /estimates/:id (JSON or multipart) update
//   PATCH  /estimates/:id/review             approve / reject (Manager)
//   DELETE /estimates/:id                    delete
// =============================================================

import { roleRequest } from "../../../services/roleApi";
import { API_BASE_URL } from "../../../services/api";

const call = (viewer, path, options = {}) =>
  roleRequest(viewer.role, viewer.id, path, options);

// multipart request (document upload): the browser sets the Content-Type boundary itself
async function sendForm(viewer, method, path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { role: viewer.role, "x-user-id": String(viewer.id) },
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return body;
}

const isForm = (data) =>
  typeof FormData !== "undefined" && data instanceof FormData;

export const getEstimates = ({ viewer, complaintId, signal }) =>
  call(
    viewer,
    `/estimates${complaintId ? `?complaintId=${complaintId}` : ""}`,
    { signal },
  );

export const getProviderEstimates = ({ viewer, providerId, signal }) =>
  call(viewer, `/estimates/provider/${providerId}`, { signal });

export const getEstimateById = ({ viewer, id, signal }) =>
  call(viewer, `/estimates/${id}`, { signal });

export const postEstimate = ({ viewer, data }) =>
  isForm(data)
    ? sendForm(viewer, "POST", "/estimates", data)
    : call(viewer, "/estimates", {
        method: "POST",
        body: JSON.stringify(data),
      });

export const patchEstimate = ({ viewer, id, data }) =>
  isForm(data)
    ? sendForm(viewer, "PATCH", `/estimates/${id}`, data)
    : call(viewer, `/estimates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

export const patchEstimateReview = ({ viewer, id, approved, managerNote }) =>
  call(viewer, `/estimates/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(
      approved ? { approved: true } : { approved: false, managerNote },
    ),
  });

export const deleteEstimateById = ({ viewer, id }) =>
  call(viewer, `/estimates/${id}`, { method: "DELETE" });
