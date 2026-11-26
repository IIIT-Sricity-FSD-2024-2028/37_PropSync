import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteMaintenanceById,
  getMaintenance,
  getMaintenanceRevenue,
  getMaintenanceSummary,
  patchMarkPaid,
  patchSubmitTransaction,
  postMaintenanceCharges,
  postSettleFees,
} from "./maintenanceApi";

const key = ({ role, id }) => `${role}:${id}`;
const idle = { status: "idle", error: null, requestId: null };
const succeeded = { ...idle, status: "succeeded" };
const empty = { payments: [], summary: null, revenue: null, requests: {}, revision: 0 };
const getScope = (state, session) => (state[key(session)] ??= { ...empty, requests: {} });

/** session used by the owner pages */
export function getOwnerMaintenanceSession(user) {
  return { role: user?.role || "owner", id: user?.id || 1 };
}

/* ---------------- async thunks (backend CRUD) ---------------- */

const mutationBusy = (arg, { getState }) =>
  getState().maintenance[key(arg.session)]?.requests.mutation?.status !== "loading";

// READ – dispatch(fetchMaintenance({ session }))
export const fetchMaintenance = createAsyncThunk("maintenance/fetchAll", ({ session }, { signal }) =>
  getMaintenance({ session, signal })
);

// READ – dispatch(fetchMaintenanceSummary({ session }))
export const fetchMaintenanceSummary = createAsyncThunk("maintenance/fetchSummary", ({ session }, { signal }) =>
  getMaintenanceSummary({ session, signal })
);

// READ – dispatch(fetchMaintenanceRevenue({ session }))
export const fetchMaintenanceRevenue = createAsyncThunk("maintenance/fetchRevenue", ({ session }, { signal }) =>
  getMaintenanceRevenue({ session, signal })
);

// CREATE – dispatch(createMaintenanceCharges({ session, month, amount }))
export const createMaintenanceCharges = createAsyncThunk(
  "maintenance/create",
  async ({ session, month, amount }, { dispatch }) => {
    const result = await postMaintenanceCharges({ session, month, amount });
    await dispatch(fetchMaintenance({ session })); // backend returns a summary: re-read the real records
    return result;
  },
  { condition: mutationBusy }
);

// UPDATE – dispatch(submitMaintenanceTransaction({ session, id, transactionId }))
export const submitMaintenanceTransaction = createAsyncThunk(
  "maintenance/submitTransaction",
  ({ session, id, transactionId }) => patchSubmitTransaction({ session, id, transactionId }),
  { condition: mutationBusy }
);

// UPDATE – dispatch(markMaintenancePaid({ session, id }))
export const markMaintenancePaid = createAsyncThunk(
  "maintenance/markPaid",
  ({ session, id }) => patchMarkPaid({ session, id }),
  { condition: mutationBusy }
);

// UPDATE – dispatch(settleMaintenanceFees({ session, paymentId? }))
export const settleMaintenanceFees = createAsyncThunk(
  "maintenance/settleFees",
  async ({ session, paymentId }, { dispatch }) => {
    const result = await postSettleFees({ session, paymentId });
    const refresh = session.role === "super_user" ? fetchMaintenanceRevenue : fetchMaintenance;
    await dispatch(refresh({ session }));
    return result;
  },
  { condition: mutationBusy }
);

// DELETE – dispatch(removeMaintenance({ session, id }))
export const removeMaintenance = createAsyncThunk(
  "maintenance/delete",
  async ({ session, id }) => {
    await deleteMaintenanceById({ session, id });
    return id;
  },
  { condition: mutationBusy }
);

/* ---------------- slice ---------------- */

function track(builder, thunk, operation, onSuccess) {
  builder
    .addCase(thunk.pending, (state, { meta }) => {
      getScope(state, meta.arg.session).requests[operation] = { status: "loading", error: null, requestId: meta.requestId };
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const scope = getScope(state, action.meta.arg.session);
      if (scope.requests[operation]?.requestId !== action.meta.requestId) return; // replaced by a newer request
      onSuccess(scope, action.payload);
      scope.requests[operation] = succeeded;
    })
    .addCase(thunk.rejected, (state, { meta, error }) => {
      if (meta.condition) return; // skipped: another change was still running
      const scope = getScope(state, meta.arg.session);
      if (scope.requests[operation]?.requestId !== meta.requestId) return;
      scope.requests[operation] = meta.aborted ? idle : { ...idle, status: "failed", error: error.message };
    });
}

const changed = (scope) => {
  scope.revision += 1;
};

const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState: {},
  reducers: {
    clearMaintenance: () => ({}),
  },
  extraReducers: (builder) => {
    track(builder, fetchMaintenance, "list", (scope, payments) => {
      const list = Array.isArray(payments) ? payments : [];
      scope.payments = [...new Map(list.map((payment) => [payment.id, payment])).values()];
    });
    track(builder, fetchMaintenanceSummary, "summary", (scope, summary) => {
      scope.summary = summary;
    });
    track(builder, fetchMaintenanceRevenue, "revenue", (scope, revenue) => {
      scope.revenue = revenue;
    });
    track(builder, createMaintenanceCharges, "mutation", changed);
    track(builder, settleMaintenanceFees, "mutation", changed);
    const replace = (scope, payment) => {
      if (payment?.id !== undefined) {
        scope.payments = scope.payments.map((item) => (item.id === payment.id ? payment : item));
      }
      changed(scope);
    };
    track(builder, submitMaintenanceTransaction, "mutation", replace);
    track(builder, markMaintenancePaid, "mutation", replace);
    track(builder, removeMaintenance, "mutation", (scope, id) => {
      scope.payments = scope.payments.filter((payment) => String(payment.id) !== String(id));
      changed(scope);
    });
  },
});

export const { clearMaintenance } = maintenanceSlice.actions;

/* ---------------- selectors ---------------- */
const emptyRequests = idle;
const selectScope = (state, session) => state.maintenance[key(session)] ?? empty;

export const selectMaintenance = (state, session) => selectScope(state, session).payments;
export const selectMaintenanceSummary = (state, session) => selectScope(state, session).summary;
export const selectMaintenanceRevenue = (state, session) => selectScope(state, session).revenue;
export const selectMaintenanceRequest = (state, session, operation) =>
  selectScope(state, session).requests[operation] ?? emptyRequests;
export const selectMaintenanceRevision = (state, session) => selectScope(state, session).revision;

export default maintenanceSlice.reducer;