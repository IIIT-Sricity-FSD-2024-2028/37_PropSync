import { API_BASE_URL as API_URL } from "./api";

export function getRoleSession(role) {
  let user;
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    user = {};
  }
  return {
    // The backend models Super User as a system actor (ID 0), not as the
    // previously logged-in community user stored in currentUser.
    id: role === "super_user" ? 0 : Number(user.id ?? 13),
    name: role === "super_user" ? "Super User" : user.name || "Administrator",
    role,
    communityName: user.communityName || "",
    email: role === "super_user" ? "superuser@propsync.com" : user.email || "",
  };
}

export async function roleRequest(role, userId, path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      role,
      "x-user-id": String(userId),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || `${response.status} ${response.statusText}`);
  }
  return body;
}

export function formatRole(role = "") {
  return ({ admin: "Administrator", super_user: "Super User", owner: "Property Owner", maintenance_manager: "Maintenance Manager", service_provider: "Service Provider" })[role] || role;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
}
