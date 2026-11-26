// =============================================================
// Maintenance Manager – shared Redux hooks
// Pages read complaints / service providers from the Redux store through
// these hooks; loading goes through the slices' thunks (backend first).
// =============================================================
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getManagerId, mapComplaint } from "../../../services/managerService";
import {
  complaintListKey,
  fetchComplaints,
  selectComplaintList,
  selectComplaintsRequest,
} from "../../../redux/features/complaints/complaintsSlice";
import {
  fetchUsers,
  selectUsers,
  selectUsersListStatus,
} from "../../../redux/features/users/usersSlice";

/** { role, id } sent with every manager request */
export function getManagerViewer() {
  return { role: "maintenance_manager", id: getManagerId() };
}

/**
 * This manager's complaints (raw backend objects), plus a reload function.
 * Usage: const { complaints, rows, loading, error, reload } = useManagerComplaints();
 *   rows = complaints mapped with mapComplaint() for the tables
 */
export function useManagerComplaints() {
  const dispatch = useDispatch();
  const managerId = getManagerId();
  const key = complaintListKey.manager(managerId);
  const complaints = useSelector((state) => selectComplaintList(state, key));
  const request = useSelector((state) => selectComplaintsRequest(state, key));
  const rows = useMemo(() => complaints.map(mapComplaint), [complaints]);
  const reload = useCallback(
    () =>
      dispatch(
        fetchComplaints({
          viewer: { role: "maintenance_manager", id: managerId },
          managerId,
        }),
      ),
    [dispatch, managerId],
  );
  useEffect(() => {
    const req = reload();
    return () => req.abort();
  }, [reload]);
  const loading =
    request.status === "idle" ||
    (request.status === "loading" && complaints.length === 0);
  return { complaints, rows, loading, error: request.error, reload };
}

/** Service providers visible to this manager (users slice). */
export function useServiceProviders() {
  const dispatch = useDispatch();
  const session = useMemo(() => getManagerViewer(), []);
  const users = useSelector((state) => selectUsers(state, session));
  const status = useSelector((state) => selectUsersListStatus(state, session));
  const providers = useMemo(
    () => users.filter((u) => u.role === "service_provider"),
    [users],
  );
  useEffect(() => {
    const req = dispatch(fetchUsers({ session }));
    return () => req.abort();
  }, [dispatch, session]);
  const loading =
    providers.length === 0 &&
    (!status || status.status === "idle" || status.status === "loading");
  return { providers, loading };
}
