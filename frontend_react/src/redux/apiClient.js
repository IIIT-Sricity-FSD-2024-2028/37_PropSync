// =============================================================
// Shared fetch helper for the Bills & Payments slices (bills, payments).
// Sends the "role" and "x-user-id" headers the backend RolesGuard needs.
// =============================================================

import { API_BASE_URL } from "../services/api";

export { API_BASE_URL };

// Role names the backend accepts in the "role" header
const ROLE_ALIASES = {
  manager: "maintenance_manager",
  administrator: "admin",
  "service-provider": "service_provider",
};

/** role + id of the logged-in user (LoginSignup stores it as "currentUser") */
export function getAuth() {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "{}") || {};
  } catch {
    user = {};
  }
  const role = String(user.role || "").toLowerCase();
  return { role: ROLE_ALIASES[role] || role, userId: user.id };
}

/** auth = optional { role, userId } to override the logged-in user */
export function authHeaders(auth = {}, json = false) {
  const { role, userId } = { ...getAuth(), ...auth };
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(role ? { role } : {}),
    ...(userId !== undefined && userId !== null ? { "x-user-id": String(userId) } : {}),
  };
}

export async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return body;
}

/** For thunks that accept either an id or an object: toArg(5, "id") -> { id: 5 } */
export const toArg = (arg, key) => (arg !== null && typeof arg === "object" ? arg : { [key]: arg });
