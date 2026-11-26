import { createSlice } from "@reduxjs/toolkit";

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

/**
 * notificationsSlice - Redux slice for notifications with full CRUD operations
 * and complaint/payment workflow notification handlers.
 */
const notificationsSlice = createSlice({
  name: "notifications",
  initialState: [],
  reducers: {
    // --- CRUD: CREATE ---
    createNotification: (state, action) => {
      if (!action.payload) return;
      const { type, message, userId } = action.payload;
      const complaintId = extractComplaintId(action.payload);

      // Do not create notification for a deleted complaint
      if (
        (complaintId && deletedComplaintIds.has(complaintId)) ||
        (action.payload.complaintId && deletedComplaintIds.has(String(action.payload.complaintId))) ||
        Array.from(deletedComplaintIds).some((dId) => isComplaintNotification(action.payload, dId))
      ) {
        return;
      }

      const isRej = isComplaintRejected(action.payload);
      const isEstRej = isEstimateRejected(action.payload);

      // Prevent duplicate complaint rejection notifications
      if (isRej && complaintId) {
        const existing = state.find(
          (n) => isComplaintRejected(n) && extractComplaintId(n) === complaintId
        );
        if (existing) {
          existing.message = message || existing.message;
          return;
        }
      }

      // Prevent duplicate estimate rejection notifications
      if (isEstRej && complaintId) {
        const existing = state.find(
          (n) => isEstimateRejected(n) && extractComplaintId(n) === complaintId
        );
        if (existing) {
          existing.message = message || existing.message;
          return;
        }
      }

      // Prevent exact duplicate by message & complaintId
      const isDuplicate = state.some(
        (n) =>
          extractComplaintId(n) === complaintId &&
          n.type === type &&
          String(n.userId) === String(userId) &&
          n.message?.trim().toLowerCase() === message?.trim().toLowerCase()
      );
      if (isDuplicate) return;

      const id = action.payload.id || Date.now() + Math.floor(Math.random() * 1000);
      const createdAt = action.payload.createdAt || new Date().toISOString();
      const status = action.payload.status || "unread";
      const time = action.payload.time || new Date(createdAt).toLocaleString();
      const newNotif = {
        ...action.payload,
        id,
        status,
        createdAt,
        time,
      };
      if (complaintId) {
        newNotif.complaintId = Number(complaintId);
      }
      state.unshift(newNotif);
    },

    // --- CRUD: READ (Set all notifications) ---
    setNotifications: (_state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set();
      const deduplicated = [];

      for (const item of incoming) {
        const cId = extractComplaintId(item);

        // Filter out any notifications regarding deleted complaints
        if (
          (cId && deletedComplaintIds.has(cId)) ||
          (item.complaintId && deletedComplaintIds.has(String(item.complaintId))) ||
          Array.from(deletedComplaintIds).some((dId) => isComplaintNotification(item, dId))
        ) {
          continue;
        }

        const isRej = isComplaintRejected(item);
        const isEstRej = isEstimateRejected(item);

        // For complaint_rejected, allow only one notification per complaint
        const rejectKey = isRej && cId ? `reject-${cId}` : null;
        // For estimate rejection, allow only one notification per complaint
        const estimateRejectKey = isEstRej && cId ? `est-reject-${cId}` : null;
        const msgKey = `${item.userId || ""}-${cId || ""}-${item.type || ""}-${(item.message || "").trim().toLowerCase()}`;

        if (seen.has(msgKey) || (rejectKey && seen.has(rejectKey)) || (estimateRejectKey && seen.has(estimateRejectKey))) {
          continue;
        }

        seen.add(msgKey);
        if (rejectKey) seen.add(rejectKey);
        if (estimateRejectKey) seen.add(estimateRejectKey);

        const entry = { ...item };
        if (cId) {
          entry.complaintId = Number(cId);
        }
        deduplicated.push(entry);
      }

      return deduplicated;
    },

    // --- CRUD: UPDATE ---
    updateNotification: (state, action) => {
      const { id } = action.payload || {};
      const index = state.findIndex((n) => String(n.id) === String(id));
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },

    markNotificationAsRead: (state, action) => {
      const id = typeof action.payload === "object" ? action.payload?.id : action.payload;
      const notif = state.find((n) => String(n.id) === String(id));
      if (notif) {
        notif.status = "read";
      }
    },

    markAllNotificationsAsRead: (state, action) => {
      const userId = typeof action.payload === "object" ? action.payload?.userId : action.payload;
      state.forEach((n) => {
        if (!userId || String(n.userId) === String(userId)) {
          n.status = "read";
        }
      });
    },

    // --- CRUD: DELETE ---
    deleteNotification: (state, action) => {
      const id = typeof action.payload === "object" ? action.payload?.id : action.payload;
      return state.filter((n) => String(n.id) !== String(id));
    },

    clearAllNotifications: (state, action) => {
      const userId = typeof action.payload === "object" ? action.payload?.userId : action.payload;
      if (userId) {
        return state.filter((n) => String(n.userId) !== String(userId));
      }
      return [];
    },

    // --- LIFECYCLE: Cancel / Delete complaint notification visibility ---
    // When owner cancels or deletes a complaint, any notifications regarding it
    // should not be visible anywhere.
    cancelComplaintNotifications: (state, action) => {
      const rawId = typeof action.payload === "object" ? action.payload?.complaintId : action.payload;
      const complaintId = rawId !== undefined && rawId !== null ? String(rawId) : null;
      if (!complaintId) return state;

      deletedComplaintIds.add(complaintId);

      return state.filter((n) => !isComplaintNotification(n, complaintId));
    },

    // --- WORKFLOW HELPERS ---
    // 1. Owner submitted complaint -> notify maintenance manager for approval
    notifyComplaintSubmitted: (state, action) => {
      const { complaintId, title, managerId = 5 } = action.payload || {};
      const id = Date.now() + Math.floor(Math.random() * 1000);
      state.unshift({
        id,
        userId: Number(managerId),
        complaintId: Number(complaintId),
        type: "complaint_submitted",
        recipient: "maintenance_manager",
        title: "New Complaint Submitted",
        message: `New complaint submitted for approval: "${title || "Complaint"}" (Ref: #${complaintId}).`,
        status: "unread",
        createdAt: new Date().toISOString(),
        time: "Just now",
      });
    },

    // 2. Maintenance manager approved complaint -> notify service providers and owner
    notifyComplaintApproved: (state, action) => {
      const { complaintId, title, ownerId, providerId = 10, providerIds } = action.payload || {};
      const now = new Date().toISOString();
      const ids = Array.isArray(providerIds) && providerIds.length > 0 ? providerIds : [providerId];

      // Notify service provider(s)
      ids.forEach((pId) => {
        const exists = state.some(
          (n) => String(n.complaintId) === String(complaintId) &&
            n.type === "complaint_approved" &&
            String(n.userId) === String(pId)
        );
        if (!exists) {
          state.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000) + Number(pId),
            userId: Number(pId),
            complaintId: Number(complaintId),
            type: "complaint_approved",
            recipient: "service_provider",
            title: "Complaint Approved",
            message: `Complaint #${complaintId} ("${title || "Issue"}") was approved by Maintenance Manager. You may submit an estimate.`,
            status: "unread",
            createdAt: now,
            time: "Just now",
          });
        }
      });

      // Notify owner if not already notified
      if (ownerId) {
        const ownerExists = state.some(
          (n) => String(n.complaintId) === String(complaintId) &&
            n.type === "complaint_approved" &&
            String(n.userId) === String(ownerId)
        );
        if (!ownerExists) {
          state.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000) + 1,
            userId: Number(ownerId),
            complaintId: Number(complaintId),
            type: "complaint_approved",
            recipient: "owner",
            title: "Complaint Approved",
            message: `Your complaint #${complaintId} ("${title || "Issue"}") has been approved by the Maintenance Manager.`,
            status: "unread",
            createdAt: now,
            time: "Just now",
          });
        }
      }
    },

    // 3. Maintenance manager rejected complaint -> notify only to owner (deduplicated)
    notifyComplaintRejected: (state, action) => {
      const { complaintId, title, ownerId = 1, reason = "Not specified" } = action.payload || {};
      const cId = String(complaintId);
      const message = `Your complaint #${complaintId} ("${title || "Issue"}") was rejected by Maintenance Manager. Reason: ${reason}`;
      const existing = state.find(
        (n) => isComplaintRejected(n) && extractComplaintId(n) === cId
      );
      if (existing) {
        existing.message = message;
        return;
      }
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(ownerId),
        complaintId: Number(complaintId),
        type: "complaint_rejected",
        recipient: "owner",
        title: "Complaint Rejected",
        message,
        status: "unread",
        createdAt: new Date().toISOString(),
        time: "Just now",
      });
    },

    // 4. Service providers accept complaint & submit estimate -> notify maintenance manager and owner
    notifyEstimateSubmitted: (state, action) => {
      const { complaintId, title, ownerId = 1, providerId = 10, cost, managerId = 5 } = action.payload || {};
      const now = new Date().toISOString();
      // Notify Maintenance Manager
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(managerId),
        complaintId: Number(complaintId),
        type: "estimate_submitted",
        recipient: "maintenance_manager",
        title: "Estimate Submitted",
        message: `Service Provider #${providerId} submitted an estimate of ₹${cost || 0} for Complaint #${complaintId} ("${title || "Issue"}").`,
        status: "unread",
        createdAt: now,
        time: "Just now",
      });
      // Notify Owner
      if (ownerId) {
        state.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          userId: Number(ownerId),
          complaintId: Number(complaintId),
          type: "estimate_submitted",
          recipient: "owner",
          title: "Estimate Submitted",
          message: `An estimate of ₹${cost || 0} has been submitted for your complaint #${complaintId} ("${title || "Issue"}").`,
          status: "unread",
          createdAt: now,
          time: "Just now",
        });
      }
    },

    // 5. Maintenance manager assign service provider & approved estimate -> notify service provider and owner
    notifyEstimateApproved: (state, action) => {
      const { complaintId, title, ownerId = 1, providerId = 10 } = action.payload || {};
      const now = new Date().toISOString();
      // Notify Service Provider
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(providerId),
        complaintId: Number(complaintId),
        type: "estimate_approved",
        recipient: "service_provider",
        title: "Estimate Approved & Task Assigned",
        message: `Your estimate for Complaint #${complaintId} ("${title || "Issue"}") has been approved and assigned to you. Work can begin.`,
        status: "unread",
        createdAt: now,
        time: "Just now",
      });
      // Notify Owner
      if (ownerId) {
        state.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          userId: Number(ownerId),
          complaintId: Number(complaintId),
          type: "provider_assigned",
          recipient: "owner",
          title: "Provider Assigned & Estimate Approved",
          message: `Service provider #${providerId} has been assigned to your complaint #${complaintId} ("${title || "Issue"}").`,
          status: "unread",
          createdAt: now,
          time: "Just now",
        });
      }
    },

    // 6. Maintenance manager rejects estimate -> notify service provider (deduplicated)
    notifyEstimateRejected: (state, action) => {
      const { complaintId, title, providerId = 10, reason = "Estimate rejected" } = action.payload || {};
      const cId = String(complaintId);
      const message = `Your estimate for Complaint #${complaintId} ("${title || "Issue"}") was rejected by Maintenance Manager. Reason: ${reason}`;
      const existing = state.find(
        (n) => isEstimateRejected(n) && extractComplaintId(n) === cId
      );
      if (existing) {
        existing.message = message;
        return;
      }
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(providerId),
        complaintId: Number(complaintId),
        type: "custom",
        recipient: "service_provider",
        title: "Estimate Rejected",
        message,
        status: "unread",
        createdAt: new Date().toISOString(),
        time: "Just now",
      });
    },

    // 7. Service provider update status and submit bill -> notify maintenance manager and owner
    notifyStatusAndBillSubmitted: (state, action) => {
      const { complaintId, title, ownerId = 1, providerId = 10, amount, managerId = 5 } = action.payload || {};
      const now = new Date().toISOString();
      // Notify Maintenance Manager
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(managerId),
        complaintId: Number(complaintId),
        type: "payment_due",
        recipient: "maintenance_manager",
        title: "Bill Submitted for Approval",
        message: `Service Provider #${providerId} submitted a bill of ₹${amount || 0} for Complaint #${complaintId} ("${title || "Issue"}").`,
        status: "unread",
        createdAt: now,
        time: "Just now",
      });
      // Notify Owner
      if (ownerId) {
        state.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          userId: Number(ownerId),
          complaintId: Number(complaintId),
          type: "payment_due",
          recipient: "owner",
          title: "Service Completed & Bill Submitted",
          message: `Work for complaint #${complaintId} ("${title || "Issue"}") is completed and bill of ₹${amount || 0} is submitted.`,
          status: "unread",
          createdAt: now,
          time: "Just now",
        });
      }
    },

    // 8. Maintenance manager paid bill -> notify service provider and owner: payment completed and complaint closed
    notifyBillPaid: (state, action) => {
      const { complaintId, title, ownerId = 1, providerId = 10 } = action.payload || {};
      const now = new Date().toISOString();
      const message = `Payment is completed and complaint is closed for Complaint #${complaintId} ("${title || "Issue"}").`;
      // Notify Service Provider
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(providerId),
        complaintId: Number(complaintId),
        type: "work_completed",
        recipient: "service_provider",
        title: "Payment Completed & Complaint Closed",
        message,
        status: "unread",
        createdAt: now,
        time: "Just now",
      });
      // Notify Owner
      if (ownerId) {
        state.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          userId: Number(ownerId),
          complaintId: Number(complaintId),
          type: "work_completed",
          recipient: "owner",
          title: "Payment Completed & Complaint Closed",
          message,
          status: "unread",
          createdAt: now,
          time: "Just now",
        });
      }
    },

    // 9. Maintenance manager submit monthly maintenance cost -> notify all owners under him in their payment history in owner dashboard
    notifyMonthlyMaintenanceSubmitted: (state, action) => {
      const { month, amount, ownerIds = [1] } = action.payload || {};
      const now = new Date().toISOString();
      ownerIds.forEach((ownerId) => {
        state.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + Number(ownerId),
          userId: Number(ownerId),
          type: "payment_due",
          recipient: "owner",
          title: "Monthly Maintenance Due",
          message: `Monthly maintenance fee of ₹${Number(amount || 0).toLocaleString("en-IN")} for ${month} has been published. Please check Payment History in your Owner Dashboard.`,
          status: "unread",
          createdAt: now,
          time: "Just now",
        });
      });
    },

    // 10. Owner payment done -> notify maintenance manager
    notifyOwnerPaymentCompleted: (state, action) => {
      const { ownerId = 1, unit = "A-101", month = "Current Month", amount = 0, transactionId = "", managerId = 5 } = action.payload || {};
      state.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: Number(managerId),
        type: "custom",
        recipient: "maintenance_manager",
        title: "Owner Maintenance Payment Received",
        message: `Owner #${ownerId} (Unit ${unit}) has completed maintenance payment of ₹${Number(amount || 0).toLocaleString("en-IN")} for ${month} (Txn: ${transactionId}).`,
        status: "unread",
        createdAt: new Date().toISOString(),
        time: "Just now",
      });
    },

    // 11. Owner submits rating after complaint closed -> notify service provider
    notifyRatingSubmitted: (state, action) => {
      const { complaintId, title, providerId = 10, score = 5, feedback } = action.payload || {};
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const createdAt = new Date().toISOString();
      const feedbackStr = feedback ? ` Feedback: "${feedback}"` : "";
      state.unshift({
        id,
        userId: Number(providerId),
        complaintId: Number(complaintId),
        type: "custom",
        recipient: "service_provider",
        title: "New Rating Received",
        message: `Owner submitted a rating of ${score}/5 for closed Complaint #${complaintId} ("${title || "Task"}").${feedbackStr}`,
        status: "unread",
        createdAt,
        time: "Just now",
      });
    },
  },
});

export const {
  createNotification,
  setNotifications,
  updateNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  cancelComplaintNotifications,
  notifyComplaintSubmitted,
  notifyComplaintApproved,
  notifyComplaintRejected,
  notifyEstimateSubmitted,
  notifyEstimateApproved,
  notifyEstimateRejected,
  notifyStatusAndBillSubmitted,
  notifyBillPaid,
  notifyMonthlyMaintenanceSubmitted,
  notifyOwnerPaymentCompleted,
  notifyRatingSubmitted,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
