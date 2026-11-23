import { createSlice } from "@reduxjs/toolkit";

const complaintsSlice = createSlice({
  name: "complaints",
  initialState: [],
  reducers: {
    createComplaint: (state, action) => {
      state.push(action.payload);
    },

    setComplaints: (_state, action) => {
      return action.payload;
    },

    updateComplaint: (state, action) => {
      const index = state.findIndex(
        (c) => String(c.id) === String(action.payload.id)
      );
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },

    updateComplaintStatus: (state, action) => {
      const { id, status } = action.payload;
      const complaint = state.find((c) => String(c.id) === String(id));
      if (complaint) {
        complaint.status = status;
      }
    },

    deleteComplaint: (state, action) => {
      const id = typeof action.payload === "object" ? action.payload.id : action.payload;
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
  deleteComplaint,
  checkDuplicateComplaint,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;
