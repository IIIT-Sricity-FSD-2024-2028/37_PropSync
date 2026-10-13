// Shared notification service for PropSync
// Combined version: team API (role, userId) + owner API (user object) – all roles use this file
import { API_BASE_URL } from "./api";

// --------------------------------------------------
// Common helpers
// --------------------------------------------------

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

function getUserId(user) {
  if (user && typeof user === "object" && user.id !== undefined) {
    return String(user.id);
  }

  // a number / numeric id (a role name like "maintenance_manager" is NOT an id)
  if (user !== undefined && user !== null && user !== "" && /^\d+$/.test(String(user))) {
    return String(user);
  }

  const currentUser = getCurrentUser();
  return currentUser.id !== undefined ? String(currentUser.id) : "";
}

function getUserRole(user, fallback = "owner") {
  if (typeof user === "string") {
    return user;
  }

  return user?.role || getCurrentUser().role || fallback;
}

function getHeaders(user, fallbackRole = "owner") {
  const role = getUserRole(user, fallbackRole);
  const userId = getUserId(user);

  return {
    "Content-Type": "application/json",
    role,
    ...(userId ? { "x-user-id": userId } : {}),
  };
}

// --------------------------------------------------
// Fetch notifications
// --------------------------------------------------

export async function getNotifications(user) {
  const uid = getUserId(user);
  if (!uid) return [];

  const url = new URL(`${API_BASE_URL}/notifications`);
  url.searchParams.set("userId", uid);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(user),
  });

  if (!response.ok) {
    throw new Error(`Failed to load notifications: ${response.statusText}`);
  }

  return response.json();
}

export const getUserNotifications = getNotifications;

// Team API: fetchNotifications(role, userId, status)
export async function fetchNotifications(
  role = "admin",
  userId = 13,
  status = ""
) {
  const url = new URL(`${API_BASE_URL}/notifications`);

  if (status && status !== "all") {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders({ role, id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
}

// --------------------------------------------------
// Mark one notification as read
// Supports (id, user) and (id, role, userId)
// --------------------------------------------------

export async function markNotificationAsRead(
  id,
  user = "owner",
  userId
) {
  const identity =
    userId !== undefined
      ? { role: user, id: userId }
      : user;

  const response = await fetch(
    `${API_BASE_URL}/notifications/${id}/read`,
    {
      method: "PATCH",
      headers: getHeaders(identity),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark notification as read: ${response.statusText}`
    );
  }

  return response.json();
}

export const markNotificationRead = markNotificationAsRead;

// --------------------------------------------------
// Mark all notifications as read
// --------------------------------------------------

export async function markAllNotificationsRead(
  user,
  role = "owner"
) {
  const identity =
    typeof user === "object" && user !== null
      ? user
      : { id: user, role };

  const uid = getUserId(identity);
  if (!uid) return;

  const response = await fetch(
    `${API_BASE_URL}/notifications/user/${uid}/mark-all-read`,
    {
      method: "PATCH",
      headers: getHeaders(identity),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark all notifications as read: ${response.statusText}`
    );
  }

  return response.json();
}

// Team API: markAllNotificationsAsRead(userId, role)
export async function markAllNotificationsAsRead(
  userId = 13,
  role = "admin"
) {
  return markAllNotificationsRead({ id: userId, role });
}

// --------------------------------------------------
// Delete one notification
// --------------------------------------------------

export async function deleteNotification(
  id,
  user = "owner",
  userId
) {
  const identity =
    userId !== undefined
      ? { role: user, id: userId }
      : user;

  const response = await fetch(
    `${API_BASE_URL}/notifications/${id}`,
    {
      method: "DELETE",
      headers: getHeaders(identity),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete notification: ${response.statusText}`
    );
  }

  return response.json();
}

// --------------------------------------------------
// Clear all notifications for a user
// --------------------------------------------------

export async function clearAllNotifications(
  user,
  role = "owner"
) {
  const identity =
    typeof user === "object" && user !== null
      ? user
      : { id: user, role };

  const uid = getUserId(identity);
  if (!uid) return;

  const response = await fetch(
    `${API_BASE_URL}/notifications/user/${uid}/clear`,
    {
      method: "DELETE",
      headers: getHeaders(identity),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to clear notifications: ${response.statusText}`
    );
  }

  return response.json();
}

// --------------------------------------------------
// Create notification
// Supports (data, user) and (dto, role, senderUserId)
// --------------------------------------------------

export async function createNotification(
  data,
  user = "maintenance_manager",
  senderUserId
) {
  const currentUser = getCurrentUser();

  const identity =
    senderUserId !== undefined
      ? { role: user, id: senderUserId }
      : typeof user === "object" && user !== null
        ? user
        : {
            role: user,
            id: currentUser.id ?? 5,
          };

  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: "POST",
    headers: getHeaders(identity, "maintenance_manager"),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message ||
        `Failed to create notification: ${response.statusText}`
    );
  }

  return response.json();
}

export const createManagerNotification = createNotification;

// --------------------------------------------------
// Fetch service providers for notification targeting
// --------------------------------------------------

export async function fetchServiceProviders(
  role = "maintenance_manager",
  userId = 5
) {
  const response = await fetch(
    `${API_BASE_URL}/users?role=service_provider`,
    {
      method: "GET",
      headers: getHeaders({ role, id: userId }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch service providers: ${response.statusText}`
    );
  }

  return response.json();
}
