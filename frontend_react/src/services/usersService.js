import { nanoid } from "@reduxjs/toolkit";
import {
  addUser, deleteUser, selectUserDetailStatus, selectUserMutation,
  selectUsersListStatus, selectUsersRevision, setSelectedUser, setUsers,
  setUsersError, setUsersLoading, updateUser,
} from "../redux/features/users/usersSlice";
import { roleRequest } from "./roleApi";

const statusSelectors = {
  list: selectUsersListStatus,
  detail: selectUserDetailStatus,
  mutation: selectUserMutation,
};

async function requestUsers({ dispatch, getState }, session, operation, path, options, onSuccess) {
  const currentRequest = () => statusSelectors[operation](getState(), session);
  if (operation === "mutation" && currentRequest().status === "loading") {
    throw new Error("A user change is already in progress.");
  }

  const requestId = nanoid();
  dispatch(setUsersLoading({ session, operation, requestId }));

  try {
    let result;
    let revision;
    // A read that overlaps a successful write must fetch the updated records.
    do {
      revision = selectUsersRevision(getState(), session);
      result = await roleRequest(session.role, session.id, path, options);
      options.signal?.throwIfAborted();
    } while (operation !== "mutation" && currentRequest().requestId === requestId
      && revision !== selectUsersRevision(getState(), session));

    // A newer request or a session reset may have cleared this request ID.
    if (currentRequest().requestId === requestId) dispatch(onSuccess(result));
    return result;
  } catch (error) {
    if (currentRequest().requestId === requestId) {
      dispatch(setUsersError({ session, operation, error: options.signal?.aborted ? null : error.message }));
    }
    throw error;
  }
}

export function fetchUsers(redux, { session, signal }) {
  return requestUsers(redux, session, "list", "/users", { signal },
    (users) => setUsers({ session, users }));
}

export function fetchUserById(redux, { session, id }) {
  return requestUsers(redux, session, "detail", `/users/${id}`, {},
    (user) => setSelectedUser({ session, user }));
}

export function createUser(redux, { session, data }) {
  return requestUsers(redux, session, "mutation", "/users",
    { method: "POST", body: JSON.stringify(data) }, (user) => addUser({ session, user }));
}

export function saveUser(redux, { session, id, data }) {
  return requestUsers(redux, session, "mutation", `/users/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }, (user) => updateUser({ session, user }));
}

export function removeUser(redux, { session, id }) {
  return requestUsers(redux, session, "mutation", `/users/${id}`, { method: "DELETE" },
    () => deleteUser({ session, id }));
}
