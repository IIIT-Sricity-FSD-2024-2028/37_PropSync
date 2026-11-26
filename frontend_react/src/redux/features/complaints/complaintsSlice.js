// =============================================================
// Complaints slice
//
// Flow for every backend operation:
//   UI -> thunk -> complaintsApi -> backend/DB -> success -> Redux updated -> UI
//
// CRUD (async thunks)
//   C  createComplaint          POST   /complaints (multipart)
//   R  fetchComplaints          GET    /complaints[?managerId=]
//      fetchOwnerComplaints     GET    /complaints/owner/:ownerId
//      fetchProviderComplaints  GET    /complaints/provider/:providerId
//      fetchComplaintById       GET    /complaints/:id
//      fetchProviderQueue       GET    /complaints/:id/queue
//   U  updateComplaintStatus    PATCH  /complaints/:id/status
//      assignProvider           PATCH  /complaints/:id/assign/:providerId
//      providerAction           PATCH  /complaints/:id/sp-interest | sp-accept | sp-reject
//   D  deleteComplaint          DELETE /complaints/:id
//
// Shape: every complaint is stored once in `entities`; each list a page
// shows (a manager's, an owner's, a provider's...) is a list of ids under a
// key from complaintListKey. Read lists with selectComplaintList(state, key).
// =============================================================

import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import {
  deleteComplaintById,
  getComplaintById,
  getComplaints,
  getOwnerComplaints,
  getProviderComplaints,
  getProviderQueue,
  patchAssignProvider,
  patchComplaintStatus,
  patchProviderAction,
  postComplaint,
} from "./complaintsApi";

/** keys for the lists pages show */
export const complaintListKey = {
  all: (viewer) => `all:${viewer.role}:${viewer.id}`,
  manager: (managerId) => `manager:${managerId}`,
  owner: (ownerId) => `owner:${ownerId}`,
  provider: (providerId) => `provider:${providerId}`,
};

const idle = { status: "idle", error: null };
const sameId = (a, b) => String(a) === String(b);

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – dispatch(fetchComplaints({ viewer, managerId? }))
export const fetchComplaints = createAsyncThunk(
  "complaints/fetchAll",
  ({ viewer, managerId }, { signal }) =>
    getComplaints({ viewer, managerId, signal }),
);

// READ – dispatch(fetchOwnerComplaints({ viewer, ownerId }))
export const fetchOwnerComplaints = createAsyncThunk(
  "complaints/fetchByOwner",
  ({ viewer, ownerId }, { signal }) =>
    getOwnerComplaints({ viewer, ownerId, signal }),
);

// READ – dispatch(fetchProviderComplaints({ viewer, providerId }))
export const fetchProviderComplaints = createAsyncThunk(
  "complaints/fetchByProvider",
  ({ viewer, providerId }, { signal }) =>
    getProviderComplaints({ viewer, providerId, signal }),
);

// READ – dispatch(fetchComplaintById({ viewer, id }))
export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchById",
  ({ viewer, id }, { signal }) => getComplaintById({ viewer, id, signal }),
);

// READ – providers interested in a complaint: dispatch(fetchProviderQueue({ viewer, id }))
export const fetchProviderQueue = createAsyncThunk(
  "complaints/fetchQueue",
  ({ viewer, id }, { signal }) => getProviderQueue({ viewer, id, signal }),
);

// CREATE – dispatch(createComplaint({ viewer, formData }))  or  ({ viewer, data }) for JSON
export const createComplaint = createAsyncThunk(
  "complaints/create",
  ({ viewer, formData, data }) => postComplaint({ viewer, formData, data }),
);

// UPDATE – dispatch(updateComplaintStatus({ viewer, id, body: { status, deadline?, rejectionReason? } }))
export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateStatus",
  ({ viewer, id, body }) => patchComplaintStatus({ viewer, id, body }),
);

// UPDATE – dispatch(assignProvider({ viewer, id, providerId, details }))
export const assignProvider = createAsyncThunk(
  "complaints/assignProvider",
  (arg) => patchAssignProvider(arg),
);

// UPDATE – dispatch(providerAction({ viewer, id, action: "sp-interest" | "sp-accept" | "sp-reject", body }))
export const providerAction = createAsyncThunk(
  "complaints/providerAction",
  (arg) => patchProviderAction(arg),
);

// DELETE – dispatch(deleteComplaint({ viewer, id }))
export const deleteComplaint = createAsyncThunk(
  "complaints/delete",
  async ({ viewer, id }) => {
    await deleteComplaintById({ viewer, id });
    return id;
  },
);

/* ---------------- slice ---------------- */

const listKeyOf = (type, arg) => {
  if (type.startsWith("complaints/fetchByOwner"))
    return complaintListKey.owner(arg.ownerId);
  if (type.startsWith("complaints/fetchByProvider"))
    return complaintListKey.provider(arg.providerId);
  return arg.managerId
    ? complaintListKey.manager(arg.managerId)
    : complaintListKey.all(arg.viewer);
};

function upsert(state, complaint) {
  if (!complaint || complaint.id === undefined) return;
  state.entities[complaint.id] = {
    ...(state.entities[complaint.id] || {}),
    ...complaint,
  };
}

const listThunks = [
  fetchComplaints,
  fetchOwnerComplaints,
  fetchProviderComplaints,
];

const complaintsSlice = createSlice({
  name: "complaints",
  initialState: {
    entities: {},
    lists: {},
    requests: {},
    queues: {},
    mutation: idle,
  },
  reducers: {
    clearComplaintsError: (state) => {
      state.mutation = idle;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of listThunks) {
      builder
        .addCase(thunk.pending, (state, { type, meta }) => {
          state.requests[listKeyOf(type, meta.arg)] = {
            status: "loading",
            error: null,
          };
        })
        .addCase(thunk.fulfilled, (state, { type, meta, payload }) => {
          const list = Array.isArray(payload) ? payload : [];
          list.forEach((c) => upsert(state, c));
          const key = listKeyOf(type, meta.arg);
          state.lists[key] = list.map((c) => c.id);
          state.requests[key] = { status: "succeeded", error: null };
        })
        .addCase(thunk.rejected, (state, { type, meta, error }) => {
          state.requests[listKeyOf(type, meta.arg)] = meta.aborted
            ? idle
            : { status: "failed", error: error.message };
        });
    }

    builder
      .addCase(fetchComplaintById.pending, (state, { meta }) => {
        state.requests[`one:${meta.arg.id}`] = {
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchComplaintById.fulfilled, (state, { meta, payload }) => {
        upsert(state, payload);
        state.requests[`one:${meta.arg.id}`] = {
          status: "succeeded",
          error: null,
        };
      })
      .addCase(fetchComplaintById.rejected, (state, { meta, error }) => {
        state.requests[`one:${meta.arg.id}`] = meta.aborted
          ? idle
          : { status: "failed", error: error.message };
      })
      .addCase(fetchProviderQueue.fulfilled, (state, { meta, payload }) => {
        state.queues[meta.arg.id] = payload;
      });

    // every change: store what the backend saved
    const mutations = [
      createComplaint,
      updateComplaintStatus,
      assignProvider,
      providerAction,
    ];
    for (const thunk of mutations) {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutation = { status: "loading", error: null };
        })
        .addCase(thunk.fulfilled, (state, { payload, meta }) => {
          upsert(state, payload);
          if (thunk === createComplaint && payload?.id !== undefined) {
            const key = complaintListKey.owner(
              payload.ownerId ?? meta.arg.viewer.id,
            );
            state.lists[key] = [
              payload.id,
              ...(state.lists[key] || []).filter(
                (id) => !sameId(id, payload.id),
              ),
            ];
            const allKey = complaintListKey.all(meta.arg.viewer);
            if (state.lists[allKey])
              state.lists[allKey] = [
                payload.id,
                ...state.lists[allKey].filter((id) => !sameId(id, payload.id)),
              ];
          }
          state.mutation = { status: "succeeded", error: null };
        })
        .addCase(thunk.rejected, (state, { error }) => {
          state.mutation = { status: "failed", error: error.message };
        });
    }

    builder
      .addCase(deleteComplaint.pending, (state) => {
        state.mutation = { status: "loading", error: null };
      })
      .addCase(deleteComplaint.fulfilled, (state, { payload: id }) => {
        delete state.entities[id];
        for (const key of Object.keys(state.lists)) {
          state.lists[key] = state.lists[key].filter(
            (listId) => !sameId(listId, id),
          );
        }
        state.mutation = { status: "succeeded", error: null };
      })
      .addCase(deleteComplaint.rejected, (state, { error }) => {
        state.mutation = { status: "failed", error: error.message };
      });
  },
});

export const { clearComplaintsError } = complaintsSlice.actions;

/* ---------------- selectors ---------------- */
const EMPTY = [];
const selectEntities = (state) => state.complaints.entities;
const selectLists = (state) => state.complaints.lists;

export const selectComplaintList = createSelector(
  [selectEntities, selectLists, (_state, key) => key],
  (entities, lists, key) =>
    lists[key] ? lists[key].map((id) => entities[id]).filter(Boolean) : EMPTY,
);
export const selectComplaintById = (state, id) =>
  id === undefined || id === null ? undefined : state.complaints.entities[id];
export const selectComplaintsRequest = (state, key) =>
  state.complaints.requests[key] ?? idle;
export const selectComplaintRequest = (state, id) =>
  state.complaints.requests[`one:${id}`] ?? idle;
export const selectProviderQueue = (state, id) => state.complaints.queues[id];
export const selectComplaintMutation = (state) => state.complaints.mutation;

export default complaintsSlice.reducer;
