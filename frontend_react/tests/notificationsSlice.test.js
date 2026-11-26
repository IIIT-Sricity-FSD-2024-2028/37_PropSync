import test from "node:test";
import assert from "node:assert/strict";
import notificationsReducer, {
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
  resetDeletedComplaints,
  selectServiceProviderNotifications,
} from "../src/redux/features/notifications/notificationsSlice.js";

test("notificationsSlice - initial state is an empty array", () => {
  const state = notificationsReducer(undefined, { type: "@@INIT" });
  assert.deepEqual(state, []);
});

test("notificationsSlice - CRUD Create: adds a new notification", () => {
  const notif = {
    id: 101,
    userId: 5,
    message: "New task assigned",
    type: "provider_assigned",
    recipient: "maintenance_manager",
  };
  const state = notificationsReducer([], createNotification(notif));
  assert.equal(state.length, 1);
  assert.equal(state[0].id, 101);
  assert.equal(state[0].status, "unread");
  assert.equal(state[0].message, "New task assigned");
});

test("notificationsSlice - CRUD Read: setNotifications replaces state", () => {
  const mockNotifs = [
    { id: 1, message: "Alert 1", status: "unread" },
    { id: 2, message: "Alert 2", status: "read" },
  ];
  const state = notificationsReducer([], setNotifications(mockNotifs));
  assert.deepEqual(state, mockNotifs);
});

test("notificationsSlice - CRUD Update: updateNotification updates fields", () => {
  const initial = [{ id: 1, message: "Old message", status: "unread" }];
  const state = notificationsReducer(
    initial,
    updateNotification({ id: 1, message: "Updated message" })
  );
  assert.equal(state[0].message, "Updated message");
  assert.equal(state[0].status, "unread");
});

test("notificationsSlice - markNotificationAsRead marks one notification read", () => {
  const initial = [
    { id: 1, status: "unread" },
    { id: 2, status: "unread" },
  ];
  const state = notificationsReducer(initial, markNotificationAsRead(1));
  assert.equal(state.find((n) => n.id === 1).status, "read");
  assert.equal(state.find((n) => n.id === 2).status, "unread");
});

test("notificationsSlice - markAllNotificationsAsRead marks all read", () => {
  const initial = [
    { id: 1, userId: 5, status: "unread" },
    { id: 2, userId: 5, status: "unread" },
    { id: 3, userId: 10, status: "unread" },
  ];
  // Filtered by userId
  const filtered = notificationsReducer(
    initial,
    markAllNotificationsAsRead({ userId: 5 })
  );
  assert.equal(filtered.find((n) => n.id === 1).status, "read");
  assert.equal(filtered.find((n) => n.id === 2).status, "read");
  assert.equal(filtered.find((n) => n.id === 3).status, "unread");

  // All users
  const allRead = notificationsReducer(initial, markAllNotificationsAsRead());
  assert.ok(allRead.every((n) => n.status === "read"));
});

test("notificationsSlice - CRUD Delete: deleteNotification removes by id", () => {
  const initial = [
    { id: 1, message: "A" },
    { id: 2, message: "B" },
  ];
  const state = notificationsReducer(initial, deleteNotification(1));
  assert.equal(state.length, 1);
  assert.equal(state[0].id, 2);
});

test("notificationsSlice - clearAllNotifications empties notifications", () => {
  const initial = [
    { id: 1, userId: 5 },
    { id: 2, userId: 10 },
  ];
  const state = notificationsReducer(initial, clearAllNotifications());
  assert.deepEqual(state, []);
});

test("notificationsSlice - lifecycle: cancelComplaintNotifications hides notification from manager when owner cancels", () => {
  resetDeletedComplaints();
  const initial = [
    {
      id: 1,
      complaintId: 42,
      recipient: "maintenance_manager",
      message: 'New complaint submitted for approval: "Leaky Pipe" (Ref: #42).',
    },
    {
      id: 2,
      complaintId: 99,
      recipient: "maintenance_manager",
      message: 'New complaint submitted for approval: "Broken Lift" (Ref: #99).',
    },
  ];
  const state = notificationsReducer(
    initial,
    cancelComplaintNotifications(42)
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].complaintId, 99);
});

test("notificationsSlice - workflow 1: notifyComplaintSubmitted notifies maintenance manager", () => {
  const state = notificationsReducer(
    [],
    notifyComplaintSubmitted({ complaintId: 5, title: "AC Repair", managerId: 5 })
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].recipient, "maintenance_manager");
  assert.equal(state[0].type, "complaint_submitted");
  assert.match(state[0].message, /AC Repair/);
  assert.match(state[0].message, /Ref: #5/);
});

test("notificationsSlice - workflow 2: notifyComplaintApproved notifies service providers and owner", () => {
  const state = notificationsReducer(
    [],
    notifyComplaintApproved({ complaintId: 5, title: "AC Repair", ownerId: 1, providerId: 10 })
  );
  assert.equal(state.length, 2);
  const providerNotif = state.find((n) => n.recipient === "service_provider");
  const ownerNotif = state.find((n) => n.recipient === "owner");
  assert.ok(providerNotif);
  assert.ok(ownerNotif);
  assert.equal(providerNotif.type, "complaint_approved");
  assert.equal(ownerNotif.type, "complaint_approved");
});

test("notificationsSlice - workflow 3: notifyComplaintRejected notifies ONLY owner", () => {
  const state = notificationsReducer(
    [],
    notifyComplaintRejected({ complaintId: 5, title: "AC Repair", ownerId: 1, reason: "Duplicate" })
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].recipient, "owner");
  assert.equal(state[0].type, "complaint_rejected");
  assert.match(state[0].message, /Duplicate/);
});

test("notificationsSlice - workflow 4: notifyEstimateSubmitted notifies manager and owner", () => {
  const state = notificationsReducer(
    [],
    notifyEstimateSubmitted({ complaintId: 5, title: "AC Repair", ownerId: 1, providerId: 10, cost: 2500 })
  );
  assert.equal(state.length, 2);
  const managerNotif = state.find((n) => n.recipient === "maintenance_manager");
  const ownerNotif = state.find((n) => n.recipient === "owner");
  assert.ok(managerNotif);
  assert.ok(ownerNotif);
  assert.match(managerNotif.message, /2500/);
  assert.match(ownerNotif.message, /2500/);
});

test("notificationsSlice - workflow 5: notifyEstimateApproved notifies service provider and owner", () => {
  const state = notificationsReducer(
    [],
    notifyEstimateApproved({ complaintId: 5, title: "AC Repair", ownerId: 1, providerId: 10 })
  );
  assert.equal(state.length, 2);
  assert.ok(state.some((n) => n.recipient === "service_provider"));
  assert.ok(state.some((n) => n.recipient === "owner"));
});

test("notificationsSlice - workflow 6: notifyEstimateRejected notifies service provider", () => {
  const state = notificationsReducer(
    [],
    notifyEstimateRejected({ complaintId: 5, title: "AC Repair", providerId: 10, reason: "Cost too high" })
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].recipient, "service_provider");
  assert.match(state[0].message, /Cost too high/);
});

test("notificationsSlice - workflow 7: notifyStatusAndBillSubmitted notifies manager and owner", () => {
  const state = notificationsReducer(
    [],
    notifyStatusAndBillSubmitted({ complaintId: 5, title: "AC Repair", ownerId: 1, providerId: 10, amount: 2500 })
  );
  assert.equal(state.length, 2);
  assert.ok(state.some((n) => n.recipient === "maintenance_manager"));
  assert.ok(state.some((n) => n.recipient === "owner"));
});

test("notificationsSlice - workflow 8: notifyBillPaid notifies service provider and owner that payment is completed and complaint is closed", () => {
  const state = notificationsReducer(
    [],
    notifyBillPaid({ complaintId: 5, title: "AC Repair", ownerId: 1, providerId: 10 })
  );
  assert.equal(state.length, 2);
  for (const notif of state) {
    assert.match(notif.message, /Payment is completed and complaint is closed/);
  }
});

test("notificationsSlice - workflow 9: notifyMonthlyMaintenanceSubmitted notifies owners in payment history", () => {
  const state = notificationsReducer(
    [],
    notifyMonthlyMaintenanceSubmitted({ month: "December 2026", amount: 3500, ownerIds: [1, 2] })
  );
  assert.equal(state.length, 2);
  assert.ok(state.every((n) => n.recipient === "owner"));
  assert.match(state[0].message, /Payment History in your Owner Dashboard/);
});

test("notificationsSlice - workflow 10: notifyOwnerPaymentCompleted notifies maintenance manager", () => {
  const state = notificationsReducer(
    [],
    notifyOwnerPaymentCompleted({ ownerId: 1, unit: "B-204", month: "December 2026", amount: 3500, transactionId: "TXN12345" })
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].recipient, "maintenance_manager");
  assert.match(state[0].message, /TXN12345/);
});

test("notificationsSlice - deduplication: only one complaint rejection notification is allowed per complaint", () => {
  const incoming = [
    {
      id: 1,
      userId: 1,
      title: "Complaint Rejected",
      message: "Your complaint #17 was rejected by Maintenance Manager. Reason: sdfghjk",
      type: "complaint_rejected",
    },
    {
      id: 2,
      userId: 1,
      title: "Complaint Rejected",
      message: "Your complaint #17 has been rejected: sdfghjk",
      type: "complaint_rejected",
      complaintId: 17,
    },
  ];
  const state = notificationsReducer([], setNotifications(incoming));
  assert.equal(state.length, 1);
  assert.equal(state[0].complaintId, 17);
});

test("notificationsSlice - deduplication: only one estimate rejection notification is allowed per complaint", () => {
  const incoming = [
    {
      id: 1,
      userId: 10,
      title: "Estimate Rejected",
      message: "Your estimate for Complaint #15 was rejected by Maintenance Manager. Reason: too high",
      type: "custom",
    },
    {
      id: 2,
      userId: 10,
      title: "Estimate Reviewed",
      message: "Your estimate for complaint #15 was rejected. too high",
      type: "estimate_approved",
      complaintId: 15,
    },
  ];
  const state = notificationsReducer([], setNotifications(incoming));
  assert.equal(state.length, 1);
  assert.equal(state[0].complaintId, 15);
});

test("notificationsSlice - when owner deletes complaint all notifications regarding it become not visible", () => {
  resetDeletedComplaints();
  const initial = [
    { id: 1, complaintId: 17, recipient: "maintenance_manager", message: "New complaint submitted Ref: #17" },
    { id: 2, complaintId: 17, recipient: "owner", title: "Complaint Approved", message: "Your complaint #17 has been approved" },
    { id: 3, complaintId: 17, recipient: "service_provider", message: "Complaint #17 was approved" },
    { id: 4, complaintId: 17, recipient: "owner", title: "Complaint Rejected", message: "Your complaint #17 has been rejected: duplicate" },
    { id: 5, complaintId: 17, recipient: "maintenance_manager", message: "Service Provider submitted a bill of 1000 for Complaint #17" },
    { id: 6, complaintId: 25, recipient: "owner", message: "Complaint #25 is in progress" },
  ];
  const state = notificationsReducer(initial, cancelComplaintNotifications(17));
  // All notifications regarding complaint 17 must be removed
  assert.equal(state.length, 1);
  assert.equal(state[0].complaintId, 25);

  // Subsequent setNotifications should also ignore incoming notifications regarding complaint 17
  const incoming = [
    { id: 7, complaintId: 17, message: "Your complaint #17 update" },
    { id: 8, complaintId: 25, message: "Complaint #25 is resolved" },
  ];
  const updatedState = notificationsReducer([], setNotifications(incoming));
  assert.equal(updatedState.length, 1);
  assert.equal(updatedState[0].complaintId, 25);
});

test("notificationsSlice - workflow 11: notifyRatingSubmitted notifies service provider when owner submits rating", () => {
  const state = notificationsReducer(
    [],
    notifyRatingSubmitted({
      complaintId: 10,
      title: "Broken Fan",
      providerId: 10,
      score: 5,
      feedback: "Great and fast work!",
    })
  );
  assert.equal(state.length, 1);
  assert.equal(state[0].recipient, "service_provider");
  assert.equal(state[0].userId, 10);
  assert.equal(state[0].title, "New Rating Received");
  assert.match(state[0].message, /5\/5/);
  assert.match(state[0].message, /Great and fast work!/);
});

test("notificationsSlice - selectServiceProviderNotifications returns only service provider notifications matching notifications page", () => {
  resetDeletedComplaints();
  const list = [
    { id: 1, userId: 10, recipient: "service_provider", message: "Task assigned" },
    { id: 2, userId: 1, recipient: "owner", message: "Complaint approved" },
    { id: 3, userId: 5, recipient: "maintenance_manager", message: "Estimate submitted" },
    { id: 4, userId: 10, recipient: "service_provider", message: "New Rating Received" },
    { id: 5, userId: 99, recipient: "service_provider", message: "Other provider task" },
  ];
  const providerNotifs = selectServiceProviderNotifications(list, 10);
  assert.equal(providerNotifs.length, 2);
  assert.equal(providerNotifs[0].id, 1);
  assert.equal(providerNotifs[1].id, 4);
});
