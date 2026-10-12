// SHARED - may be replaced by team version
const API_BASE_URL = 'http://localhost:3000';

function getHeaders(user) {
  const role = user?.role || 'owner';
  const userId = user?.id !== undefined ? String(user.id) : (JSON.parse(localStorage.getItem('currentUser') || '{}').id || '5');
  return {
    'Content-Type': 'application/json',
    'role': role,
    'x-user-id': String(userId)
  };
}

export async function getNotifications(user) {
  const uid = typeof user === 'object' ? user?.id : user;
  if (!uid && uid !== 0) return [];
  const response = await fetch(`${API_BASE_URL}/notifications?userId=${uid}`, {
    method: 'GET',
    headers: getHeaders(typeof user === 'object' ? user : { id: uid })
  });
  if (!response.ok) throw new Error('Failed to load notifications');
  return response.json();
}

export const getUserNotifications = getNotifications;

export async function markNotificationAsRead(id, user) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders(user)
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
}

export const markNotificationRead = markNotificationAsRead;

export async function markAllNotificationsRead(user) {
  const uid = typeof user === 'object' ? user?.id : user;
  if (!uid && uid !== 0) return;
  const response = await fetch(`${API_BASE_URL}/notifications/user/${uid}/mark-all-read`, {
    method: 'PATCH',
    headers: getHeaders(typeof user === 'object' ? user : { id: uid })
  });
  if (!response.ok) throw new Error('Failed to mark all as read');
  return response.json();
}

export async function deleteNotification(id, user) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: getHeaders(user)
  });
  if (!response.ok) throw new Error('Failed to delete notification');
  return response.json();
}

export async function clearAllNotifications(user) {
  const uid = typeof user === 'object' ? user?.id : user;
  if (!uid && uid !== 0) return;
  const response = await fetch(`${API_BASE_URL}/notifications/user/${uid}/clear`, {
    method: 'DELETE',
    headers: getHeaders(typeof user === 'object' ? user : { id: uid })
  });
  if (!response.ok) throw new Error('Failed to clear notifications');
  return response.json();
}

export async function createNotification(data, user) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = user?.role || currentUser?.role || 'maintenance_manager';
  const roleHeader = userRole === 'admin' ? 'admin' : 'maintenance_manager';
  const userId = user?.id !== undefined ? String(user.id) : (currentUser?.id || '5');

  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'role': roleHeader,
      'x-user-id': String(userId)
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to send notification');
  return response.json();
}

export const createManagerNotification = createNotification;
