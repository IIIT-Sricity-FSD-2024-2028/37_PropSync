import { nanoid } from "@reduxjs/toolkit";
import {
  completeMaintenanceMutation, deleteMaintenance, selectMaintenanceRequest,
  selectMaintenanceRevision, setMaintenance, setMaintenanceError, setMaintenanceLoading,
  setMaintenanceRevenue, setMaintenanceSummary, updateMaintenance,
} from "../redux/features/maintenance/maintenanceSlice";
import { roleRequest } from "./roleApi";

export function getOwnerMaintenanceSession(user) {
  return { role: user?.role || "owner", id: user?.id || 1 };
}

async function requestMaintenance(redux, session, operation, path, options, onSuccess) {
  const { dispatch, getState } = redux;
  const current = () => selectMaintenanceRequest(getState(), session, operation);
  if (operation === "mutation" && current().status === "loading") {
    throw new Error("A maintenance change is already in progress.");
  }
  const requestId = nanoid();
  dispatch(setMaintenanceLoading({ session, operation, requestId }));
  try {
    let result;
    let revision;
    do {
      revision = selectMaintenanceRevision(getState(), session);
      result = await roleRequest(session.role, session.id, path, options);
      options.signal?.throwIfAborted();
    } while (operation !== "mutation" && current().requestId === requestId
      && revision !== selectMaintenanceRevision(getState(), session));

    if (current().requestId === requestId) onSuccess(result);
    return result;
  } catch (error) {
    if (current().requestId === requestId) {
      dispatch(setMaintenanceError({ session, operation, error: options.signal?.aborted ? null : error.message }));
    }
    throw error;
  }
}

function read(redux, session, operation, path, signal, action) {
  return requestMaintenance(redux, session, operation, path, { signal }, (result) => redux.dispatch(action(result)));
}

export function fetchMaintenance(redux, { session, signal }) {
  const path = session.role === "owner" ? `/maintenance/owner/${session.id}` : "/maintenance";
  return read(redux, session, "list", path, signal, (payments) => setMaintenance({ session, payments }));
}

export function fetchMaintenanceSummary(redux, { session, signal }) {
  return read(redux, session, "summary", `/maintenance/owner/${session.id}/summary`, signal,
    (summary) => setMaintenanceSummary({ session, summary }));
}

export function fetchMaintenanceRevenue(redux, { session, signal }) {
  return read(redux, session, "revenue", "/maintenance/revenue", signal,
    (revenue) => setMaintenanceRevenue({ session, revenue }));
}

function write(redux, session, path, method, data, onSuccess) {
  return requestMaintenance(redux, session, "mutation", `/maintenance/${path}`,
    { method, body: JSON.stringify(data) }, onSuccess);
}

async function writeAndRefresh(redux, session, path, data, refresh) {
  let refreshRequest;
  const result = await write(redux, session, path, "POST", data, () => {
    redux.dispatch(completeMaintenanceMutation(session));
    // The backend returns totals or a message. Refresh the affected view for the actual records.
    refreshRequest = refresh(redux, { session }).catch(() => { /* The read exposes its own error. */ });
  });
  await refreshRequest;
  return result;
}

export function createMaintenanceCharges(redux, { session, month, amount }) {
  return writeAndRefresh(redux, session, "create", { month, amount }, fetchMaintenance);
}

export function submitMaintenanceTransaction(redux, { session, id, transactionId }) {
  return write(redux, session, `${id}/submit-transaction`, "PATCH", { transactionId },
    (payment) => redux.dispatch(updateMaintenance({ session, payment })));
}

export function markMaintenancePaid(redux, { session, id }) {
  return write(redux, session, `${id}/mark-paid`, "PATCH", undefined,
    (payment) => redux.dispatch(updateMaintenance({ session, payment })));
}

export function settleMaintenanceFees(redux, { session, paymentId }) {
  const data = paymentId ? { paymentId } : { managerId: session.id || undefined };
  const refresh = session.role === "super_user" ? fetchMaintenanceRevenue : fetchMaintenance;
  return writeAndRefresh(redux, session, "settle-fee", data, refresh);
}

export function removeMaintenance(redux, { session, id }) {
  return write(redux, session, id, "DELETE", undefined, () => redux.dispatch(deleteMaintenance({ session, id })));
}
