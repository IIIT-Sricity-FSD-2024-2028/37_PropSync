import { createSlice } from "@reduxjs/toolkit";

const complaintsSlice = createSlice({
  name: "complaints",
  initialState: [],
  reducers: {
    createComplaint: (state, action) => {
      if (action.payload) {
        state.unshift(action.payload);
      }
    },

    setComplaints: (_state, action) => {
      return Array.isArray(action.payload) ? action.payload : [];
    },

    updateComplaint: (state, action) => {
      const index = state.findIndex(
        (c) => String(c.id) === String(action.payload?.id)
      );
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },

    updateComplaintStatus: (state, action) => {
      const { id, status, deadline, rejectionReason } = action.payload || {};
      const complaint = state.find((c) => String(c.id) === String(id));
      if (complaint) {
        if (status) complaint.status = status;
        if (deadline !== undefined) complaint.deadline = deadline;
        if (rejectionReason !== undefined) complaint.rejectionReason = rejectionReason;
      }
    },

    assignProvider: (state, action) => {
      const { id, providerId, deadline } = action.payload || {};
      const complaint = state.find((c) => String(c.id) === String(id));
      if (complaint) {
        complaint.assignedProviderId = providerId;
        complaint.status = "in_progress";
        complaint.estimateApproved = true;
        complaint.spAccepted = true;
        if (deadline) complaint.deadline = deadline;
      }
    },

    deleteComplaint: (state, action) => {
      const id = typeof action.payload === "object" ? action.payload?.id : action.payload;
      const complaint = state.find((c) => String(c.id) === String(id));
      const status = (complaint?.status || (typeof action.payload === "object" ? action.payload?.status : "") || "").toLowerCase();
      if (status) {
        const allowed = status === "pending" || status === "rejected" || status === "resolved" || status === "closed";
        if (!allowed) return state;
      }
      return state.filter((c) => String(c.id) !== String(id));
    },

    checkDuplicateComplaint: (state, action) => {
      const title = typeof action.payload === "string" ? action.payload : action.payload?.title;
      const id = typeof action.payload === "object" ? action.payload?.id : undefined;
      const exists = state.some(
        (c) =>
          c.title?.trim().toLowerCase() === title?.trim().toLowerCase() &&
          (id === undefined || String(c.id) !== String(id))
      );
      if (exists) {
        console.warn("Duplicate complaint detected:", title);
      }
    },
  },
});

export const {
  createComplaint,
  setComplaints,
  updateComplaint,
  updateComplaintStatus,
  assignProvider,
  deleteComplaint,
  checkDuplicateComplaint,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
