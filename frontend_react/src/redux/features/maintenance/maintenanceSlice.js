import { createSlice } from "@reduxjs/toolkit";

const key = ({ role, id }) => `${role}:${id}`;
const idle = { status: "idle", error: null, requestId: null };
const empty = { payments: [], summary: null, revenue: null, requests: {}, revision: 0 };
const selectScope = (state, session) => state.maintenance[key(session)] ?? empty;
const getScope = (state, session) => state[key(session)] ??= { ...empty, requests: {} };
const succeeded = { ...idle, status: "succeeded" };

export const selectMaintenance = (state, session) => selectScope(state, session).payments;
export const selectMaintenanceSummary = (state, session) => selectScope(state, session).summary;
export const selectMaintenanceRevenue = (state, session) => selectScope(state, session).revenue;
export const selectMaintenanceRequest = (state, session, operation) =>
  selectScope(state, session).requests[operation] ?? idle;
export const selectMaintenanceRevision = (state, session) => selectScope(state, session).revision;

function finishWrite(scope) {
  scope.requests.mutation = succeeded;
  scope.revision += 1;
}

const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState: {},
  reducers: {
    setMaintenance(state, { payload: { session, payments } }) {
      const scope = getScope(state, session);
      scope.payments = [...new Map(payments.map((payment) => [payment.id, payment])).values()];
      scope.requests.list = succeeded;
    },
    setMaintenanceSummary(state, { payload: { session, summary } }) {
      const scope = getScope(state, session);
      scope.summary = summary;
      scope.requests.summary = succeeded;
    },
    setMaintenanceRevenue(state, { payload: { session, revenue } }) {
      const scope = getScope(state, session);
      scope.revenue = revenue;
      scope.requests.revenue = succeeded;
    },
    updateMaintenance(state, { payload: { session, payment } }) {
      const scope = getScope(state, session);
      scope.payments = scope.payments.map((item) => item.id === payment.id ? payment : item);
      finishWrite(scope);
    },
    deleteMaintenance(state, { payload: { session, id } }) {
      const scope = getScope(state, session);
      scope.payments = scope.payments.filter((payment) => String(payment.id) !== String(id));
      finishWrite(scope);
    },
    completeMaintenanceMutation(state, { payload: session }) {
      finishWrite(getScope(state, session));
    },
    setMaintenanceLoading(state, { payload: { session, operation, requestId } }) {
      getScope(state, session).requests[operation] = { ...idle, status: "loading", requestId };
    },
    setMaintenanceError(state, { payload: { session, operation, error } }) {
      getScope(state, session).requests[operation] = error ? { ...idle, status: "failed", error } : idle;
    },
    clearMaintenance: () => ({}),
  },
});

export const {
  setMaintenance, setMaintenanceSummary, setMaintenanceRevenue, updateMaintenance,
  deleteMaintenance, completeMaintenanceMutation, setMaintenanceLoading, setMaintenanceError,
  clearMaintenance,
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
