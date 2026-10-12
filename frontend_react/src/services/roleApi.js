const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getRoleSession(role) {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    user = {};
  }
  return {
    id: Number(user.id ?? (role === "super_user" ? 0 : 13)),
    name: user.name || (role === "super_user" ? "Super User" : "Administrator"),
    role,
    communityName: user.communityName || "",
    email: user.email || "",
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