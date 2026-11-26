// =============================================================
// Complaints – backend calls used by complaintsSlice.js (Repository/API layer)
// Backend: backend/src/modules/complaints/complaints.controller.ts
//
//   GET    /complaints[?managerId=]          list (scoped by role)
//   GET    /complaints/owner/:ownerId        an owner's complaints
//   GET    /complaints/provider/:providerId  a provider's tasks
//   GET    /complaints/:id                   one complaint
//   GET    /complaints/:id/queue             providers interested in a complaint
//   POST   /complaints  (multipart: photo)   create (Owner, Admin)
//   PATCH  /complaints/:id/status            approve / reject / progress
//   PATCH  /complaints/:id/assign/:providerId  assign (Manager)
//   PATCH  /complaints/:id/sp-interest | sp-accept | sp-reject   (Service Provider)
//   DELETE /complaints/:id                   delete (Owner, Admin, Super User)
// =============================================================

import { roleRequest } from "../../../services/roleApi";
import { API_BASE_URL } from "../../../services/api";

const call = (viewer, path, options = {}) => roleRequest(viewer.role, viewer.id, path, options);

// the owner pages show "caption" / "image"
const withOwnerFields = (c) => (c ? { ...c, caption: c.description, image: c.photo } : c);

export const getComplaints = ({ viewer, managerId, signal }) =>
  call(viewer, `/complaints${managerId ? `?managerId=${managerId}` : ""}`, { signal });

export const getOwnerComplaints = async ({ viewer, ownerId, signal }) =>
  ((await call(viewer, `/complaints/owner/${ownerId}`, { signal })) || []).map(withOwnerFields);

export const getProviderComplaints = ({ viewer, providerId, signal }) =>
  call(viewer, `/complaints/provider/${providerId}`, { signal });

export const getComplaintById = async ({ viewer, id, signal }) =>
  withOwnerFields(await call(viewer, `/complaints/${id}`, { signal }));

export const getProviderQueue = ({ viewer, id, signal }) => call(viewer, `/complaints/${id}/queue`, { signal });

// multipart (photo upload): the browser sets the Content-Type boundary itself
// formData = multipart (owner, with photo); data = plain JSON (admin form)
export async function postComplaint({ viewer, formData, data }) {
  const isJson = !formData && data !== undefined;
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: {
      role: viewer.role,
      "x-user-id": String(viewer.id),
      ...(isJson ? { "Content-Type": "application/json" } : {}),
    },
    body: isJson ? JSON.stringify(data) : formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || "Failed to submit complaint");
  }
  return withOwnerFields(body);
}

export const patchComplaintStatus = ({ viewer, id, body }) =>
  call(viewer, `/complaints/${id}/status`, { method: "PATCH", body: JSON.stringify(body) });

export const patchAssignProvider = ({ viewer, id, providerId, details = {} }) =>
  call(viewer, `/complaints/${id}/assign/${providerId}`, { method: "PATCH", body: JSON.stringify(details) });

// action = "sp-interest" | "sp-accept" | "sp-reject"
export const patchProviderAction = ({ viewer, id, action, body = {} }) =>
  call(viewer, `/complaints/${id}/${action}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteComplaintById = ({ viewer, id }) => call(viewer, `/complaints/${id}`, { method: "DELETE" });
