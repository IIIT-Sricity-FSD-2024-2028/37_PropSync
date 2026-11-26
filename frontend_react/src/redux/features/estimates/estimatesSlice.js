// =============================================================
// Estimates slice – service providers' cost estimates
//
// Flow for every backend operation:
//   UI -> thunk -> estimatesApi -> backend/DB -> success -> Redux updated -> UI
//
// CRUD (async thunks)
//   C  createEstimate          POST   /estimates (multipart)
//   R  fetchEstimates          GET    /estimates[?complaintId=]
//      fetchProviderEstimates  GET    /estimates/provider/:providerId
//      fetchEstimateById       GET    /estimates/:id
//   U  updateEstimate          PATCH  /estimates/:id
//      reviewEstimate          PATCH  /estimates/:id/review   (approve / reject)
//   D  deleteEstimate          DELETE /estimates/:id          (removed from Redux only after success)
//
// Read with selectEstimates (all loaded), selectEstimatesForComplaint,
// selectEstimatesForProvider.
// =============================================================

import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import {
  deleteEstimateById,
  getEstimateById,
  getEstimates,
  getProviderEstimates,
  patchEstimate,
  patchEstimateReview,
  postEstimate,
} from "./estimatesApi";

const idle = { status: "idle", error: null };
const sameId = (a, b) => String(a) === String(b);

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – dispatch(fetchEstimates({ viewer, complaintId? }))
export const fetchEstimates = createAsyncThunk(
  "estimates/fetchAll",
  ({ viewer, complaintId }, { signal }) =>
    getEstimates({ viewer, complaintId, signal }),
);

// READ – dispatch(fetchProviderEstimates({ viewer, providerId }))
export const fetchProviderEstimates = createAsyncThunk(
  "estimates/fetchByProvider",
  ({ viewer, providerId }, { signal }) =>
    getProviderEstimates({ viewer, providerId, signal }),
);

// READ – dispatch(fetchEstimateById({ viewer, id }))
export const fetchEstimateById = createAsyncThunk(
  "estimates/fetchById",
  ({ viewer, id }, { signal }) => getEstimateById({ viewer, id, signal }),
);

// CREATE – dispatch(createEstimate({ viewer, data: FormData }))
export const createEstimate = createAsyncThunk(
  "estimates/create",
  ({ viewer, data }) => postEstimate({ viewer, data }),
);

// UPDATE – dispatch(updateEstimate({ viewer, id, data }))
export const updateEstimate = createAsyncThunk(
  "estimates/update",
  ({ viewer, id, data }) => patchEstimate({ viewer, id, data }),
);

// UPDATE – dispatch(reviewEstimate({ viewer, id, approved, managerNote? }))
export const reviewEstimate = createAsyncThunk("estimates/review", (arg) =>
  patchEstimateReview(arg),
);

// DELETE – dispatch(deleteEstimate({ viewer, id }))
export const deleteEstimate = createAsyncThunk(
  "estimates/delete",
  async ({ viewer, id }) => {
    await deleteEstimateById({ viewer, id });
    return id;
  },
);

/* ---------------- slice ---------------- */

function upsert(state, estimate) {
  if (!estimate || estimate.id === undefined) return;
  state.entities[estimate.id] = {
    ...(state.entities[estimate.id] || {}),
    ...estimate,
  };
}

// replace the estimates covered by a read (all / one complaint / one provider)
function replaceCovered(state, list, covers) {
  for (const [id, estimate] of Object.entries(state.entities)) {
    if (covers(estimate)) delete state.entities[id];
  }
  list.forEach((e) => upsert(state, e));
}

const estimatesSlice = createSlice({
  name: "estimates",
  initialState: { entities: {}, request: idle, mutation: idle },
  reducers: {
    clearEstimatesError: (state) => {
      state.mutation = idle;
    },
  },
  extraReducers: (builder) => {
    const reads = [fetchEstimates, fetchProviderEstimates];
    for (const thunk of reads) {
      builder
        .addCase(thunk.pending, (state) => {
          state.request = { status: "loading", error: null };
        })
        .addCase(thunk.fulfilled, (state, { payload, meta }) => {
          const list = Array.isArray(payload) ? payload : [];
          const { complaintId, providerId } = meta.arg;
          const covers =
            thunk === fetchProviderEstimates
              ? (e) => sameId(e.providerId, providerId)
              : complaintId
                ? (e) => sameId(e.complaintId, complaintId)
                : () => true;
          replaceCovered(state, list, covers);
          state.request = { status: "succeeded", error: null };
        })
        .addCase(thunk.rejected, (state, { meta, error }) => {
          state.request = meta.aborted
            ? idle
            : { status: "failed", error: error.message };
        });
    }
    builder.addCase(fetchEstimateById.fulfilled, (state, { payload }) =>
      upsert(state, payload),
    );

    for (const thunk of [createEstimate, updateEstimate, reviewEstimate]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutation = { status: "loading", error: null };
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          upsert(state, payload);
          state.mutation = { status: "succeeded", error: null };
        })
        .addCase(thunk.rejected, (state, { error }) => {
          state.mutation = { status: "failed", error: error.message };
        });
    }

    builder
      .addCase(deleteEstimate.pending, (state) => {
        state.mutation = { status: "loading", error: null };
      })
      .addCase(deleteEstimate.fulfilled, (state, { payload: id }) => {
        delete state.entities[id];
        state.mutation = { status: "succeeded", error: null };
      })
      .addCase(deleteEstimate.rejected, (state, { error }) => {
        state.mutation = { status: "failed", error: error.message };
      });
  },
});

export const { clearEstimatesError } = estimatesSlice.actions;

/* ---------------- selectors ---------------- */
const selectEntities = (state) => state.estimates.entities;

export const selectEstimates = createSelector([selectEntities], (entities) =>
  Object.values(entities).sort((a, b) => Number(a.id) - Number(b.id)),
);
export const selectEstimatesForComplaint = createSelector(
  [selectEstimates, (_state, complaintId) => complaintId],
  (list, complaintId) => list.filter((e) => sameId(e.complaintId, complaintId)),
);
export const selectEstimatesForProvider = createSelector(
  [selectEstimates, (_state, providerId) => providerId],
  (list, providerId) => list.filter((e) => sameId(e.providerId, providerId)),
);
export const selectEstimateById = (state, id) => state.estimates.entities[id];
export const selectEstimatesRequest = (state) => state.estimates.request;
export const selectEstimateMutation = (state) => state.estimates.mutation;

export default estimatesSlice.reducer;
