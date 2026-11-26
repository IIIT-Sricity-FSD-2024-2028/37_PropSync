// =============================================================
// Ratings – backend calls used by ratingsSlice.js (Repository/API layer)
// Backend: backend/src/modules/ratings/ratings.controller.ts
//
//   GET    /ratings?ownerId=&complaintId=   list (Manager, Admin, Provider, Owner)
//   GET    /ratings/:id                     one rating
//   POST   /ratings                         create (Owner)   { ownerId, complaintId, score, feedback }
//   DELETE /ratings/:id                     delete (Admin)
//   (the backend has no update route for ratings)
// =============================================================

import { roleRequest } from "../../../services/roleApi";

const query = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.ownerId !== undefined && filters.ownerId !== null) params.set("ownerId", filters.ownerId);
  if (filters.complaintId !== undefined && filters.complaintId !== null) params.set("complaintId", filters.complaintId);
  const text = params.toString();
  return text ? `?${text}` : "";
};

// viewer = { role, id } of the logged-in user
export const getRatings = ({ viewer, filters, signal }) =>
  roleRequest(viewer.role, viewer.id, `/ratings${query(filters)}`, { signal });

export const getRatingById = ({ viewer, id }) => roleRequest(viewer.role, viewer.id, `/ratings/${id}`);

export const postRating = ({ viewer, rating }) =>
  roleRequest(viewer.role, viewer.id, "/ratings", { method: "POST", body: JSON.stringify(rating) });

export const deleteRatingById = ({ viewer, id }) =>
  roleRequest(viewer.role, viewer.id, `/ratings/${id}`, { method: "DELETE" });
