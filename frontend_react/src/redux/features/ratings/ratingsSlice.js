// =============================================================
// Ratings slice – owner feedback on completed complaints
//
// Flow for every backend operation:
//   UI -> thunk -> ratingsApi -> backend/DB -> success -> Redux updated -> UI
//
// CRUD (async thunks)
//   C  submitRating     POST   /ratings            (Owner)
//   R  fetchRatings     GET    /ratings?ownerId=&complaintId=
//      fetchRatingById  GET    /ratings/:id
//   U  (none – the backend has no update route for ratings)
//   D  deleteRating     DELETE /ratings/:id        (Admin)
// =============================================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteRatingById, getRatingById, getRatings, postRating } from "./ratingsApi";

function currentViewer() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}") || {};
    return { role: user.role || "owner", id: user.id ?? 1 };
  } catch {
    return { role: "owner", id: 1 };
  }
}
const viewerOf = (arg) => (arg && arg.viewer) || currentViewer();
const sameId = (a, b) => String(a) === String(b);

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – dispatch(fetchRatings({ viewer, filters: { ownerId, complaintId } }))
export const fetchRatings = createAsyncThunk("ratings/fetchAll", (arg = {}, { signal }) =>
  getRatings({ viewer: viewerOf(arg), filters: arg.filters, signal })
);

// READ – dispatch(fetchRatingById({ id, viewer }))
export const fetchRatingById = createAsyncThunk("ratings/fetchById", (arg) =>
  getRatingById({ viewer: viewerOf(arg), id: arg.id })
);

// CREATE – dispatch(submitRating({ rating: { ownerId, complaintId, score, feedback }, viewer }))
export const submitRating = createAsyncThunk("ratings/create", (arg) =>
  postRating({ viewer: viewerOf(arg), rating: arg.rating })
);

// DELETE – dispatch(deleteRating({ id, viewer }))
export const deleteRating = createAsyncThunk("ratings/delete", async (arg) => {
  const id = typeof arg === "object" ? arg.id : arg;
  await deleteRatingById({ viewer: viewerOf(arg), id });
  return id;
});

/* ---------------- slice ---------------- */

function upsert(state, rating) {
  if (!rating || rating.id === undefined) return;
  const i = state.findIndex(
    (r) =>
      sameId(r.id, rating.id) ||
      (sameId(r.complaintId, rating.complaintId) && sameId(r.ownerId, rating.ownerId))
  );
  if (i === -1) state.unshift(rating);
  else state[i] = { ...state[i], ...rating };
}

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: [],
  reducers: {
    // Store a rating that was just returned by the backend (kept for pages that
    // save ratings themselves; new code should use submitRating).
    createRating: (state, action) => upsert(state, action.payload),
    clearRatings: () => [],
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRatings.fulfilled, (state, action) => {
        const list = Array.isArray(action.payload) ? action.payload : [];
        const filters = action.meta.arg?.filters;
        if (!filters || (filters.ownerId === undefined && filters.complaintId === undefined)) return list;
        // a filtered read only replaces the matching ratings
        const keep = state.filter(
          (r) =>
            !(
              (filters.ownerId === undefined || sameId(r.ownerId, filters.ownerId)) &&
              (filters.complaintId === undefined || sameId(r.complaintId, filters.complaintId))
            )
        );
        return [...list, ...keep];
      })
      .addCase(fetchRatingById.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(submitRating.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(deleteRating.fulfilled, (state, action) => state.filter((r) => !sameId(r.id, action.payload)));
  },
});

export const { createRating, clearRatings } = ratingsSlice.actions;

/* ---------------- selectors ---------------- */
export const selectRatings = (state) => state.ratings || [];
export const selectRatingsByComplaint = (state, complaintId) =>
  (state.ratings || []).find((r) => String(r.complaintId) === String(complaintId));
export const selectRatingsByProviderComplaints = (state, complaintIds = []) => {
  const idSet = new Set(complaintIds.map((id) => Number(id)));
  return (state.ratings || []).filter((r) => idSet.has(Number(r.complaintId)));
};

export default ratingsSlice.reducer;
