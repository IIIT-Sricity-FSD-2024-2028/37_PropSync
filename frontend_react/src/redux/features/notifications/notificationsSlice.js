// =============================================================
// Notifications slice
//
// Flow for every backend operation:
//   UI -> thunk -> notificationsApi -> backend/DB -> success -> Redux updated -> UI
//
// CRUD (async thunks)
//   C  createNotification        POST   /notifications
//   R  fetchNotifications        GET    /notifications            (for the logged-in user)
//   U  markNotificationAsRead    PATCH  /notifications/:id/read
//      markAllNotificationsAsRead PATCH /notifications/user/:id/mark-all-read
//   D  deleteNotification        DELETE /notifications/:id
//      clearAllNotifications     DELETE /notifications/user/:id/clear
//
// Workflow helpers (notifyComplaintSubmitted, notifyBillPaid, ...) keep their
// old names but no longer invent notifications in the browser: the backend
// creates those notifications, so the helpers re-read the list from the backend.
// =============================================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteAllNotifications,
  deleteNotificationById,
  getNotificationsFor,
  patchAllNotificationsRead,
  patchNotificationRead,
  postNotification,
} from "./notificationsApi";

/**
 * Track deleted complaint IDs so notifications regarding deleted complaints are never shown
 */
export const deletedComplaintIds = new Set();
export const resetDeletedComplaints = () => deletedComplaintIds.clear();

/**
 * Check if a notification is regarding a specific complaint
 */
export const isComplaintNotification = (item, complaintId) => {
  if (!complaintId) return false;
  const targetId = String(complaintId);
  const cId = extractComplaintId(item);
  if (cId && cId === targetId) return true;
  if (item?.complaintId && String(item.complaintId) === targetId) return true;
  const msg = String(item?.message || "");
  const title = String(item?.title || "");
  return (
    msg.includes(`Ref: #${targetId}`) ||
    msg.includes(`complaint #${targetId}`) ||
    msg.includes(`Complaint #${targetId}`) ||
    title.includes(`#${targetId}`)
  );
};

/**
 * Helper to reliably parse/extract complaintId from notification object or text
 */
export const extractComplaintId = (item) => {
  if (item?.complaintId) return String(item.complaintId);
  const match = String(item?.message || "").match(/complaint\s*#(\d+)/i);
  return match ? match[1] : null;
};

/**
 * Helper to identify if notification is a complaint rejection notice
 */
export const isComplaintRejected = (item) => {
  const type = String(item?.type || "").toLowerCase();
  const title = String(item?.title || "").toLowerCase();
  const msg = String(item?.message || "").toLowerCase();
  return (
    type === "complaint_rejected" ||
    title.includes("complaint rejected") ||
    (msg.includes("rejected") && (msg.includes("complaint") || title.includes("complaint")))
  );
};

/**
 * Helper to identify if notification is an estimate rejection notice
 */
export const isEstimateRejected = (item) => {
  const title = String(item?.title || "").toLowerCase();
  const msg = String(item?.message || "").toLowerCase();
  return (
    (msg.includes("estimate") && msg.includes("rejected")) ||
    (title.includes("estimate") && msg.includes("rejected"))
  );
};

/**
 * Selector helper: returns only notifications meant for the service provider,
 * deduplicated and excluding deleted complaints. Used by both the Service Provider
 * Notifications page and the Service Provider Dashboard.
 */
export const selectServiceProviderNotifications = (notifications, providerId = 10) => {
  const pId = String(providerId);
  const seen = new Set();
  const result = [];

  for (const n of notifications || []) {
    // Only notifications intended for this service provider
    const isForProvider =
      String(n.userId) === pId ||
      (!n.userId && (n.recipient === "service_provider" || n.recipient === "all"));

    if (!isForProvider) continue;

    const cId = extractComplaintId(n);
    if (cId && deletedComplaintIds.has(cId)) continue;
    if (Array.from(deletedComplaintIds).some((dId) => isComplaintNotification(n, dId))) continue;

    const isRej = isComplaintRejected(n);
    const isEstRej = isEstimateRejected(n);

    const rejectKey = isRej && cId ? `reject-${cId}` : null;
    const estRejectKey = isEstRej && cId ? `est-reject-${cId}` : null;
    const key = `${cId || n.id}-${n.type || ""}-${(n.message || "").trim().toLowerCase()}`;

    if (seen.has(key) || (rejectKey && seen.has(rejectKey)) || (estRejectKey && seen.has(estRejectKey))) {
      continue;
    }
    seen.add(key);
    if (rejectKey) seen.add(rejectKey);
    if (estRejectKey) seen.add(estRejectKey);
    result.push(n);
  }

  return result;
};

/* ---------------- who is asking ---------------- */

function currentViewer() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}") || {};
    return user.id !== undefined ? { role: user.role, id: user.id } : null;
  } catch {
    return null;
  }
}
// arg.viewer = { role, id }; falls back to the logged-in user
const viewerOf = (arg) => (arg && arg.viewer) || currentViewer();
const idOf = (arg) => (arg !== null && typeof arg === "object" ? arg.id : arg);

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – dispatch(fetchNotifications({ viewer: { role, id } }))
export const fetchNotifications = createAsyncThunk("notifications/fetchAll", (arg, { signal }) => {
  const viewer = viewerOf(arg);
  if (!viewer) return [];
  return getNotificationsFor({ viewer, status: arg?.status, signal });
});

// CREATE – dispatch(createNotification({ data, sender: { role, id } }))
// The backend only lets a Maintenance Manager or Admin create notifications.
export const createNotification = createAsyncThunk("notifications/create", async ({ data, sender }, { fulfillWithValue }) => {
  const me = currentViewer();
  const from = sender || { role: "maintenance_manager", id: me?.id ?? 5 };
  const saved = await postNotification({ sender: from, data });
  // only notifications addressed to the logged-in user go into their list
  const mine = Boolean(
    me && saved && sameId(saved.userId, me.id) && (!saved.recipient || saved.recipient === me.role)
  );
  return fulfillWithValue(saved, { mine });
});

// UPDATE – dispatch(markNotificationAsRead({ id, viewer }))
export const markNotificationAsRead = createAsyncThunk("notifications/markRead", async (arg) => {
  const id = idOf(arg);
  await patchNotificationRead({ viewer: viewerOf(arg), id });
  return id;
});

// UPDATE – dispatch(markAllNotificationsAsRead({ viewer }))
export const markAllNotificationsAsRead = createAsyncThunk("notifications/markAllRead", async (arg) => {
  const viewer = viewerOf(arg);
  await patchAllNotificationsRead({ viewer });
  return viewer.id;
});

// DELETE – dispatch(deleteNotification({ id, viewer }))
export const deleteNotification = createAsyncThunk("notifications/delete", async (arg) => {
  const id = idOf(arg);
  await deleteNotificationById({ viewer: viewerOf(arg), id });
  return id;
});

// DELETE – dispatch(clearAllNotifications({ viewer }))
export const clearAllNotifications = createAsyncThunk("notifications/clearAll", async (arg) => {
  const viewer = viewerOf(arg);
  await deleteAllNotifications({ viewer });
  return viewer.id;
});

// Workflow helpers – same names as before. The backend creates these
// notifications itself (or the page saves them with createNotification), so
// each helper simply re-reads the logged-in user's list from the backend.
const refresh = (type) =>
  createAsyncThunk(`notifications/${type}`, async (_payload, { dispatch }) => {
    await dispatch(fetchNotifications());
    return null;
  });
export const notifyComplaintSubmitted = refresh("notifyComplaintSubmitted");
export const notifyComplaintApproved = refresh("notifyComplaintApproved");
export const notifyComplaintRejected = refresh("notifyComplaintRejected");
export const notifyEstimateSubmitted = refresh("notifyEstimateSubmitted");
export const notifyEstimateApproved = refresh("notifyEstimateApproved");
export const notifyEstimateRejected = refresh("notifyEstimateRejected");
export const notifyStatusAndBillSubmitted = refresh("notifyStatusAndBillSubmitted");
export const notifyBillPaid = refresh("notifyBillPaid");
export const notifyMonthlyMaintenanceSubmitted = refresh("notifyMonthlyMaintenanceSubmitted");
export const notifyOwnerPaymentCompleted = refresh("notifyOwnerPaymentCompleted");
export const notifyRatingSubmitted = refresh("notifyRatingSubmitted");

/* ---------------- reducers' helpers ---------------- */

const aboutDeletedComplaint = (item) => {
  const cId = extractComplaintId(item);
  return (
    (cId && deletedComplaintIds.has(cId)) ||
    (item.complaintId && deletedComplaintIds.has(String(item.complaintId))) ||
    Array.from(deletedComplaintIds).some((dId) => isComplaintNotification(item, dId))
  );
};

// Clean a list that came back from the backend: hide deleted complaints,
// keep only one rejection notice per complaint, drop exact duplicates.
function cleanList(incoming) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(incoming) ? incoming : []) {
    if (aboutDeletedComplaint(item)) continue;
    const cId = extractComplaintId(item);
    const rejectKey = isComplaintRejected(item) && cId ? `reject-${cId}` : null;
    const estimateRejectKey = isEstimateRejected(item) && cId ? `est-reject-${cId}` : null;
    const msgKey = `${item.userId || ""}-${cId || ""}-${item.type || ""}-${(item.message || "").trim().toLowerCase()}`;
    if (seen.has(msgKey) || (rejectKey && seen.has(rejectKey)) || (estimateRejectKey && seen.has(estimateRejectKey))) continue;
    seen.add(msgKey);
    if (rejectKey) seen.add(rejectKey);
    if (estimateRejectKey) seen.add(estimateRejectKey);
    result.push(cId ? { ...item, complaintId: Number(cId) } : { ...item });
  }
  return result;
}

const sameId = (a, b) => String(a) === String(b);

/* ---------------- slice ---------------- */

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: [],
  reducers: {
    // Store a list that was just returned by the backend (kept for pages that
    // load notifications themselves; new code should use fetchNotifications).
    setNotifications: (_state, action) => cleanList(action.payload),

    // Called after the backend has deleted a complaint: hide its notifications.
    cancelComplaintNotifications: (state, action) => {
      const rawId = typeof action.payload === "object" ? action.payload?.complaintId : action.payload;
      const complaintId = rawId !== undefined && rawId !== null ? String(rawId) : null;
      if (!complaintId) return state;
      deletedComplaintIds.add(complaintId);
      return state.filter((n) => !isComplaintNotification(n, complaintId));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (_state, action) => cleanList(action.payload))
      .addCase(createNotification.fulfilled, (state, action) => {
        const saved = action.payload;
        if (!action.meta.mine) return; // sent to someone else
        if (!saved || saved.id === undefined || aboutDeletedComplaint(saved)) return;
        if (state.some((n) => sameId(n.id, saved.id))) return;
        state.unshift({ ...saved, status: saved.status || "unread" });
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notif = state.find((n) => sameId(n.id, action.payload));
        if (notif) notif.status = "read";
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.forEach((n) => {
          if (sameId(n.userId, action.payload)) n.status = "read";
        });
      })
      .addCase(deleteNotification.fulfilled, (state, action) => state.filter((n) => !sameId(n.id, action.payload)))
      .addCase(clearAllNotifications.fulfilled, (state, action) =>
        state.filter((n) => !sameId(n.userId, action.payload))
      );
  },
});

export const { setNotifications, cancelComplaintNotifications } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications;

export default notificationsSlice.reducer;
