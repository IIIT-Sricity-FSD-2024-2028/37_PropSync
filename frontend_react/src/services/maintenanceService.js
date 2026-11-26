import {
  createMaintenanceCharges as createChargesThunk,
  fetchMaintenance as fetchMaintenanceThunk,
  fetchMaintenanceRevenue as fetchRevenueThunk,
  fetchMaintenanceSummary as fetchSummaryThunk,
  markMaintenancePaid as markPaidThunk,
  removeMaintenance as removeThunk,
  settleMaintenanceFees as settleThunk,
  submitMaintenanceTransaction as submitThunk,
} from "../redux/features/maintenance/maintenanceSlice";

export { getOwnerMaintenanceSession } from "../redux/features/maintenance/maintenanceSlice";

function run({ dispatch }, thunk, { signal, ...arg }) {
  const request = dispatch(thunk(arg));
  signal?.addEventListener("abort", () => request.abort(), { once: true });
  return request.unwrap();
}

export const fetchMaintenance = (redux, arg) => run(redux, fetchMaintenanceThunk, arg);
export const fetchMaintenanceSummary = (redux, arg) => run(redux, fetchSummaryThunk, arg);
export const fetchMaintenanceRevenue = (redux, arg) => run(redux, fetchRevenueThunk, arg);
export const createMaintenanceCharges = (redux, arg) => run(redux, createChargesThunk, arg);
export const submitMaintenanceTransaction = (redux, arg) => run(redux, submitThunk, arg);
export const markMaintenancePaid = (redux, arg) => run(redux, markPaidThunk, arg);
export const settleMaintenanceFees = (redux, arg) => run(redux, settleThunk, arg);
export const removeMaintenance = (redux, arg) => run(redux, removeThunk, arg);