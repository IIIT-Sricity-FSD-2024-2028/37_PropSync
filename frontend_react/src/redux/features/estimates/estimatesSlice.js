import { createSlice } from "@reduxjs/toolkit";

const estimatesSlice = createSlice({
  name: "estimates",
  initialState: [],
  reducers: {
    createEstimate: (state, action) => {
      if (action.payload) {
        state.unshift(action.payload);
      }
    },

    setEstimates: (_state, action) => {
      return Array.isArray(action.payload) ? action.payload : [];
    },

    updateEstimate: (state, action) => {
      const index = state.findIndex(
        (e) => String(e.id) === String(action.payload?.id)
      );
      if (index !== -1) {
        if (state[index].approved === true || state[index].selectionStatus === "selected") {
          return;
        }
        state[index] = { ...state[index], ...action.payload };
      }
    },

    reviewEstimate: (state, action) => {
      const { id, approved, managerNote, selectionStatus, reviewedAt } = action.payload || {};
      const estimate = state.find((e) => String(e.id) === String(id));
      if (estimate) {
        if (approved !== undefined) estimate.approved = approved;
        if (managerNote !== undefined) estimate.managerNote = managerNote;
        if (selectionStatus !== undefined) {
          estimate.selectionStatus = selectionStatus;
        } else if (approved === true) {
          estimate.selectionStatus = "selected";
        } else if (approved === false) {
          estimate.selectionStatus = "rejected";
        }
        estimate.reviewedAt = reviewedAt || new Date().toISOString();
      }
    },

    selectEstimate: (state, action) => {
      const { id, complaintId, managerNote } = action.payload || {};
      state.forEach((estimate) => {
        if (complaintId && String(estimate.complaintId) === String(complaintId)) {
          if (String(estimate.id) === String(id)) {
            estimate.approved = true;
            estimate.selectionStatus = "selected";
            if (managerNote) estimate.managerNote = managerNote;
            estimate.reviewedAt = new Date().toISOString();
          } else if (estimate.selectionStatus === "candidate") {
            estimate.selectionStatus = "not_selected";
          }
        } else if (String(estimate.id) === String(id)) {
          estimate.approved = true;
          estimate.selectionStatus = "selected";
          if (managerNote) estimate.managerNote = managerNote;
          estimate.reviewedAt = new Date().toISOString();
        }
      });
    },

    deleteEstimate: (state, action) => {
      const id = typeof action.payload === "object" ? (action.payload?.id ?? action.payload) : action.payload;
      return state.filter((e) => String(e.id) !== String(id));
    },

    checkDuplicateEstimate: (state, action) => {
      const { complaintId, providerId, id } = action.payload || {};
      const exists = state.some(
        (e) =>
          String(e.complaintId) === String(complaintId) &&
          String(e.providerId) === String(providerId) &&
          (id === undefined || String(e.id) !== String(id))
      );
      if (exists) {
        console.warn("Duplicate estimate detected:", complaintId, providerId);
      }
    },
  },
});

export const {
  createEstimate,
  setEstimates,
  updateEstimate,
  reviewEstimate,
  selectEstimate,
  deleteEstimate,
  checkDuplicateEstimate,
} = estimatesSlice.actions;

export default estimatesSlice.reducer;
