// =============================================================
// Notifications – backend calls used by notificationsSlice.js (Repository/API layer)
// Backend: backend/src/modules/notifications/notifications.controller.ts
//
//   GET    /notifications                        list for the caller (x-user-id)
//   POST   /notifications                        create (Manager / Admin role header)
//   PATCH  /notifications/:id/read               mark one read
//   PATCH  /notifications/user/:userId/mark-all-read
//   DELETE /notifications/:id                    delete one
//   DELETE /notifications/user/:userId/clear     delete all for a user
// =============================================================

import { roleRequest } from "../../../services/roleApi";

// viewer / sender = { role, id } of the logged-in user
export const getNotificationsFor = ({ viewer, status, signal }) =>
  roleRequest(viewer.role, viewer.id, `/notifications${status && status !== "all" ? `?status=${status}` : ""}`, { signal });

export const postNotification = ({ sender, data }) =>
  roleRequest(sender.role, sender.id, "/notifications", { method: "POST", body: JSON.stringify(data) });

export const patchNotificationRead = ({ viewer, id }) =>
  roleRequest(viewer.role, viewer.id, `/notifications/${id}/read`, { method: "PATCH" });

export const patchAllNotificationsRead = ({ viewer }) =>
  roleRequest(viewer.role, viewer.id, `/notifications/user/${viewer.id}/mark-all-read`, { method: "PATCH" });

export const deleteNotificationById = ({ viewer, id }) =>
  roleRequest(viewer.role, viewer.id, `/notifications/${id}`, { method: "DELETE" });

export const deleteAllNotifications = ({ viewer }) =>
  roleRequest(viewer.role, viewer.id, `/notifications/user/${viewer.id}/clear`, { method: "DELETE" });
