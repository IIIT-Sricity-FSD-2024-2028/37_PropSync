import { createSlice } from "@reduxjs/toolkit";

/**
 * ratingsSlice - Redux slice for Ratings with full CRUD operations.
 */
const ratingsSlice = createSlice({
  name: "ratings",
  initialState: [],
  reducers: {
    // --- CRUD: CREATE ---
    createRating: (state, action) => {
      if (!action.payload) return;
      const { ownerId, complaintId, score, feedback } = action.payload;
      const id = action.payload.id || Date.now() + Math.floor(Math.random() * 1000);
      const ratedAt = action.payload.ratedAt || new Date().toISOString().split("T")[0];

      // Check if rating already exists for this complaint and owner
      const existingIndex = state.findIndex(
        (r) =>
          String(r.complaintId) === String(complaintId) &&
          String(r.ownerId) === String(ownerId)
      );

      if (existingIndex !== -1) {
        state[existingIndex] = {
          ...state[existingIndex],
          score: Number(score),
          feedback,
          ratedAt,
        };
      } else {
        state.unshift({
          id,
          ownerId: Number(ownerId),
          complaintId: Number(complaintId),
          score: Number(score),
          feedback: feedback || "",
          ratedAt,
          ...action.payload,
        });
      }
    },

    // --- CRUD: READ (Set all ratings) ---
    setRatings: (_state, action) => {
      return Array.isArray(action.payload) ? action.payload : [];
    },

    // --- CRUD: UPDATE ---
    updateRating: (state, action) => {
      const { id, complaintId, ownerId } = action.payload || {};
      const index = state.findIndex((r) => {
        if (id !== undefined) return String(r.id) === String(id);
        if (complaintId !== undefined && ownerId !== undefined) {
          return (
            String(r.complaintId) === String(complaintId) &&
            String(r.ownerId) === String(ownerId)
          );
        }
        return false;
      });

      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },

    // --- CRUD: DELETE ---
    deleteRating: (state, action) => {
      const id = typeof action.payload === "object" ? action.payload?.id : action.payload;
      return state.filter((r) => String(r.id) !== String(id));
    },

    clearRatings: () => {
      return [];
    },
  },
});

export const {
  createRating,
  setRatings,
  updateRating,
  deleteRating,
  clearRatings,
} = ratingsSlice.actions;

// Aliases for convenience
export const addRating = createRating;
export const submitRating = createRating;
export const removeRating = deleteRating;

// Selectors
export const selectRatings = (state) => state.ratings || [];
export const selectRatingsByComplaint = (state, complaintId) =>
  (state.ratings || []).find((r) => String(r.complaintId) === String(complaintId));
export const selectRatingsByProviderComplaints = (state, complaintIds = []) => {
  const idSet = new Set(complaintIds.map((id) => Number(id)));
  return (state.ratings || []).filter((r) => idSet.has(Number(r.complaintId)));
};

export default ratingsSlice.reducer;
