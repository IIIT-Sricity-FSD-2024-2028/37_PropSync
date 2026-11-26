import { createSelector, createSlice } from "@reduxjs/toolkit";

const scopeKey = ({ role, id }) => `${role}:${id}`;

const idle = { status: "idle", error: null, requestId: null };
const emptyScope = { entities: {}, listIds: [], list: idle, detail: idle, mutation: idle, revision: 0 };
const selectScope = (state, session) => state.users[scopeKey(session)] ?? emptyScope;
const getOrCreateScope = (state, session) => state[scopeKey(session)] ??= {
  ...emptyScope, entities: {}, listIds: [],
};

export const selectUsers = createSelector(
  [(state, session) => selectScope(state, session).listIds,
    (state, session) => selectScope(state, session).entities],
  (ids, entities) => ids.map((id) => entities[id]),
);
export const selectUserById = (state, session, id) => selectScope(state, session).entities[id];
export const selectUsersListStatus = (state, session) => selectScope(state, session).list;
export const selectUserDetailStatus = (state, session) => selectScope(state, session).detail;
export const selectUsersRevision = (state, session) => selectScope(state, session).revision;
export const selectUserMutation = (state, session) => selectScope(state, session).mutation;

function belongsToList(user, session) {
  const community = (name) => name?.trim().toLowerCase();
  switch (session.role) {
    case "super_user":
      return true;
    case "admin":
      return user.role !== "super_user" && community(user.communityName) === community(session.communityName || undefined);
    case "maintenance_manager":
      return user.role === "service_provider";
    default:
      return false;
  }
}

function saveUser(scope, user, session) {
  scope.entities[user.id] = user;
  if (!belongsToList(user, session)) {
    scope.listIds = scope.listIds.filter((id) => id !== user.id);
  } else if (!scope.listIds.includes(user.id)) {
    scope.listIds.push(user.id);
  }
}

const succeeded = { ...idle, status: "succeeded" };
function saveUserMutation(state, { payload: { session, user } }) {
  const scope = getOrCreateScope(state, session);
  saveUser(scope, user, session);
  scope.mutation = succeeded;
  scope.revision += 1;
}

const usersSlice = createSlice({
  name: "users",
  initialState: {},
  reducers: {
    setUsers(state, { payload: { session, users } }) {
      const scope = getOrCreateScope(state, session);
      for (const id of scope.listIds) delete scope.entities[id];
      for (const user of users) scope.entities[user.id] = user;
      scope.listIds = users.map(({ id }) => id);
      scope.list = succeeded;
    },
    setSelectedUser(state, { payload: { session, user } }) {
      const scope = getOrCreateScope(state, session);
      scope.entities[user.id] = user;
      scope.detail = succeeded;
    },
    addUser: saveUserMutation,
    updateUser: saveUserMutation,
    deleteUser(state, { payload: { session, id } }) {
      const scope = getOrCreateScope(state, session);
      delete scope.entities[id];
      scope.listIds = scope.listIds.filter((userId) => String(userId) !== String(id));
      scope.mutation = succeeded;
      scope.revision += 1;
    },
    setUsersLoading(state, { payload: { session, operation, requestId } }) {
      const scope = getOrCreateScope(state, session);
      scope[operation] = { status: "loading", error: null, requestId };
    },
    setUsersError(state, { payload: { session, operation, error } }) {
      const scope = getOrCreateScope(state, session);
      scope[operation] = error ? { ...idle, status: "failed", error } : idle;
    },
    clearUserMutation(state, { payload: session }) {
      const scope = state[scopeKey(session)];
      if (scope && scope.mutation.status !== "loading") scope.mutation = idle;
    },
    clearUsers: () => ({}),
  },
});

export const {
  setUsers, setSelectedUser, addUser, updateUser, deleteUser,
  setUsersLoading, setUsersError, clearUserMutation, clearUsers,
} = usersSlice.actions;

export default usersSlice.reducer;
