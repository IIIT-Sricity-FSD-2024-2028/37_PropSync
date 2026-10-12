const API_BASE_URL = "http://localhost:3000";

/**
 * Fetch all notifications for the given user and role.
 */
export async function fetchNotifications(role = "admin", userId = 13, status = "") {
  const url = new URL(`${API_BASE_URL}/notifications`);
  if (status && status !== "all") {
    url.searchParams.append("status", status);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      role: role,
      "x-user-id": String(userId),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id, role = "admin", userId = 13) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      role: role,
      "x-user-id": String(userId),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId = 13, role = "admin") {
  const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/mark-all-read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      role: role,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id, role = "admin") {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      role: role,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Clear all notifications for a user.
 */
export async function clearAllNotifications(userId = 13, role = "admin") {
  const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/clear`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      role: role,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to clear notifications: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new notification (Maintenance Manager / Admin only).
 */
export async function createNotification(dto, role = "maintenance_manager", senderUserId = 5) {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      role: role,
      "x-user-id": String(senderUserId),
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create notification: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch list of service providers for targeting in notifications.
 */
export async function fetchServiceProviders(role = "maintenance_manager", userId = 5) {
  const response = await fetch(`${API_BASE_URL}/users?role=service_provider`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      role: role,
      "x-user-id": String(userId),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch service providers: ${response.statusText}`);
  }

  return await response.json();
}
