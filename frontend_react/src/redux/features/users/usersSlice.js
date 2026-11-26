import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import {
  deleteUserById, getPendingUsers, getUserById, getUsers, patchApproval, patchPassword, patchUser,
  postLoginRequest, postSignup, postUser,
} from "./usersApi";

const scopeKey = ({ role, id }) => `${role}:${id}`;
const idle = { status: "idle", error: null, requestId: null };
const succeeded = { ...idle, status: "succeeded" };
const emptyScope = { entities: {}, listIds: [], pending: [], list: idle, detail: idle, mutation: idle, pendingList: idle, revision: 0 };

const getScope = (state, session) =>
  (state.scopes[scopeKey(session)] ??= { ...emptyScope, entities: {}, listIds: [], pending: [] });

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

/* ---------------- async thunks (backend CRUD) ---------------- */

const mutationBusy = (arg, { getState }) =>
  getState().users.scopes[scopeKey(arg.session)]?.mutation.status !== "loading";

// READ – dispatch(fetchUsers({ session }))
export const fetchUsers = createAsyncThunk("users/fetchAll", ({ session }, { signal }) =>
  getUsers({ session, signal })
);

// READ – dispatch(fetchUserById({ session, id }))
export const fetchUserById = createAsyncThunk("users/fetchById", ({ session, id }, { signal }) =>
  getUserById({ session, id, signal })
);

// CREATE – dispatch(createUser({ session, data }))
export const createUser = createAsyncThunk("users/create", ({ session, data }) => postUser({ session, data }), {
  condition: mutationBusy,
});

// UPDATE – dispatch(saveUser({ session, id, data }))
export const saveUser = createAsyncThunk("users/update", ({ session, id, data }) => patchUser({ session, id, data }), {
  condition: mutationBusy,
});

// DELETE – dispatch(removeUser({ session, id }))
export const removeUser = createAsyncThunk(
  "users/delete",
  async ({ session, id }) => {
    await deleteUserById({ session, id });
    return id;
  },
  { condition: mutationBusy }
);

// READ – sign-up requests waiting for approval: dispatch(fetchPendingUsers({ session }))
export const fetchPendingUsers = createAsyncThunk("users/fetchPending", ({ session }, { signal }) =>
  getPendingUsers({ session, signal })
);

// UPDATE – dispatch(decideSignup({ session, id, decision: "approve" | "reject" }))
export const decideSignup = createAsyncThunk(
  "users/decideSignup",
  async ({ session, id, decision }) => {
    const result = await patchApproval({ session, id, decision });
    return { id, decision, user: result?.user || result };
  },
  { condition: mutationBusy }
);

// SIGN UP (public, before login) – dispatch(signupUser({ data }))
// Creates an account request; it is not added to any list until an admin approves it.
export const signupUser = createAsyncThunk("users/signup", ({ data }) => postSignup({ data }));

// UPDATE password – dispatch(changeUserPassword({ session, id, passwords }))
export const changeUserPassword = createAsyncThunk("users/changePassword", (arg) => patchPassword(arg));

// LOGIN – dispatch(loginUser({ email, password, role }))
export const loginUser = createAsyncThunk("users/login", async (credentials) => {
  const response = await postLoginRequest(credentials);
  const user = response?.user || response; // backend returns the user (or { user })
  localStorage.setItem("currentUser", JSON.stringify(user)); // other modules read the session from here
  return user;
});

/* ---------------- helpers ---------------- */

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

function putUser(scope, user, session) {
  scope.entities[user.id] = user;
  if (!belongsToList(user, session)) {
    scope.listIds = scope.listIds.filter((id) => id !== user.id);
  } else if (!scope.listIds.includes(user.id)) {
    scope.listIds.push(user.id);
  }
}

// pending / fulfilled / rejected handling shared by every thunk
function track(builder, thunk, operation, onSuccess) {
  builder
    .addCase(thunk.pending, (state, { meta }) => {
      getScope(state, meta.arg.session)[operation] = { status: "loading", error: null, requestId: meta.requestId };
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const scope = getScope(state, action.meta.arg.session);
      if (scope[operation].requestId !== action.meta.requestId) return; // a newer request replaced this one
      onSuccess(scope, action);
      scope[operation] = succeeded;
    })
    .addCase(thunk.rejected, (state, { meta, error }) => {
      if (meta.condition) return; // skipped because another change was still running
      const scope = getScope(state, meta.arg.session);
      if (scope[operation].requestId !== meta.requestId) return;
      scope[operation] = meta.aborted ? idle : { ...idle, status: "failed", error: error.message };
    });
}

/* ---------------- slice ---------------- */

const usersSlice = createSlice({
  name: "users",
  initialState: {
    scopes: {},
    auth: { currentUser: readStoredUser(), status: "idle", error: null },
  },
  reducers: {
    clearUserMutation(state, { payload: session }) {
      const scope = state.scopes[scopeKey(session)];
      if (scope && scope.mutation.status !== "loading") scope.mutation = idle;
    },
    clearUsers(state) {
      state.scopes = {};
    },
    // LOGOUT – the backend has no logout route; this only clears the session
    loggedOut(state) {
      state.scopes = {};
      state.auth = { currentUser: null, status: "idle", error: null };
    },
    // Call only after the backend has saved the profile (e.g. after PATCH /users/:id succeeds)
    currentUserUpdated(state, { payload }) {
      state.auth.currentUser = state.auth.currentUser ? { ...state.auth.currentUser, ...payload } : payload;
    },
  },
  extraReducers: (builder) => {
    track(builder, fetchUsers, "list", (scope, { payload }) => {
      const users = Array.isArray(payload) ? payload : [];
      for (const id of scope.listIds) delete scope.entities[id];
      for (const user of users) scope.entities[user.id] = user;
      scope.listIds = users.map(({ id }) => id);
    });
    track(builder, fetchUserById, "detail", (scope, { payload }) => {
      if (payload?.id !== undefined) scope.entities[payload.id] = payload;
    });
    const saved = (scope, { payload, meta }) => {
      putUser(scope, payload, meta.arg.session);
      scope.revision += 1;
    };
    track(builder, createUser, "mutation", saved);
    track(builder, saveUser, "mutation", saved);
    track(builder, fetchPendingUsers, "pendingList", (scope, { payload }) => {
      scope.pending = Array.isArray(payload) ? payload : [];
    });
    track(builder, decideSignup, "mutation", (scope, { payload, meta }) => {
      scope.pending = scope.pending.filter((user) => String(user.id) !== String(payload.id));
      if (payload.decision === "approve" && payload.user?.id !== undefined) putUser(scope, payload.user, meta.arg.session);
      scope.revision += 1;
    });
    track(builder, removeUser, "mutation", (scope, { payload: id }) => {
      delete scope.entities[id];
      scope.listIds = scope.listIds.filter((userId) => String(userId) !== String(id));
      scope.revision += 1;
    });

    builder
      .addCase(loginUser.pending, (state) => {
        state.auth.status = "loading";
        state.auth.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.scopes = {}; // lists belong to the previous session
        state.auth = { currentUser: payload, status: "succeeded", error: null };
      })
      .addCase(loginUser.rejected, (state, { error }) => {
        state.auth.status = "failed";
        state.auth.error = error.message;
      });
  },
});

export const { clearUserMutation, clearUsers, loggedOut, currentUserUpdated } = usersSlice.actions;

/* ---------------- selectors ---------------- */
const selectScope = (state, session) => state.users.scopes[scopeKey(session)] ?? emptyScope;

export const selectUsers = createSelector(
  [(state, session) => selectScope(state, session).listIds, (state, session) => selectScope(state, session).entities],
  (ids, entities) => ids.map((id) => entities[id])
);
export const selectUserById = (state, session, id) => selectScope(state, session).entities[id];
export const selectUsersListStatus = (state, session) => selectScope(state, session).list;
export const selectUserDetailStatus = (state, session) => selectScope(state, session).detail;
export const selectUsersRevision = (state, session) => selectScope(state, session).revision;
export const selectUserMutation = (state, session) => selectScope(state, session).mutation;
export const selectPendingUsers = (state, session) => selectScope(state, session).pending;
export const selectPendingUsersStatus = (state, session) => selectScope(state, session).pendingList;
export const selectCurrentUser = (state) => state.users.auth.currentUser;
export const selectAuthStatus = (state) => state.users.auth;

export default usersSlice.reducer;
