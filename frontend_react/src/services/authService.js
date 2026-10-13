// SHARED - may be replaced by team version
const API_BASE_URL = 'http://localhost:3000';

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

  const roleKey = roleFormatMap[role] || role.toLowerCase();

  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'role': roleKey
    },
    body: JSON.stringify({
      email,
      password,
      role: roleKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Invalid credentials. Please check your email, password, and selected role.');
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
