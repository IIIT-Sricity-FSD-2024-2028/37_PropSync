// =============================================================
// Users – backend calls used by usersSlice.js (Repository/API layer)
// Backend: backend/src/modules/users/users.controller.ts
//
//   POST   /users/login      log in (role + email + password)
//   GET    /users            list (scoped by the caller's role)
//   GET    /users/:id        one user
//   POST   /users            create / sign up
//   PATCH  /users/:id        update
//   DELETE /users/:id        delete (Admin, Super User)
//   GET    /users/pending    sign-up requests waiting for approval (Admin, Super User)
//   PATCH  /users/:id/approve | /users/:id/reject
// =============================================================

import { roleRequest } from "../../../services/roleApi";
import { loginUser as postLogin } from "../../../services/authService";
import { API_BASE_URL } from "../../../services/api";

// session = { role, id } of the logged-in user making the request
export const getUsers = ({ session, signal }) =>
  roleRequest(session.role, session.id, "/users", { signal });

export const getUserById = ({ session, id, signal }) =>
  roleRequest(session.role, session.id, `/users/${id}`, { signal });

export const postUser = ({ session, data }) =>
  roleRequest(session.role, session.id, "/users", { method: "POST", body: JSON.stringify(data) });

export const patchUser = ({ session, id, data }) =>
  roleRequest(session.role, session.id, `/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteUserById = ({ session, id }) =>
  roleRequest(session.role, session.id, `/users/${id}`, { method: "DELETE" });

export const getPendingUsers = ({ session, signal }) =>
  roleRequest(session.role, session.id, "/users/pending", { signal });

export const patchApproval = ({ session, id, decision }) =>
  roleRequest(session.role, session.id, `/users/${id}/${decision}`, { method: "PATCH" });

export const postLoginRequest = ({ email, password, role }) => postLogin(email, password, role);

// Public sign-up (no logged-in user yet): the backend accepts it with the admin role header
export async function postSignup({ data }) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", role: "admin" },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || "Signup failed.");
  }
  return body;
}

export const patchPassword = ({ session, id, passwords }) =>
  roleRequest(session.role, session.id, `/users/${id}/password`, { method: "PATCH", body: JSON.stringify(passwords) });
