// SHARED - may be replaced by team version
import { API_BASE_URL } from './api';

export async function loginUser(email, password, role) {
  const roleFormatMap = {
    'Owner': 'owner',
    'Maintenance Manager': 'maintenance_manager',
    'Service Provider': 'service_provider',
    'Administrator': 'admin',
    'owner': 'owner',
    'maintenance_manager': 'maintenance_manager',
    'service_provider': 'service_provider',
    'admin': 'admin'
  };

  const roleKey = role ? (roleFormatMap[role] || role.toLowerCase()) : undefined;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (roleKey) {
    headers['role'] = roleKey;
  }

  const body = {
    email,
    password,
  };
  if (roleKey) {
    body.role = roleKey;
  }

  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Invalid credentials. Please check your email and password.');
  }

  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'role': 'owner'
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Signup failed.');
  }

  return response.json();
}
