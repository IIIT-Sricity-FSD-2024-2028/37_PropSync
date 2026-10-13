import { API_BASE_URL } from './api';

function getHeaders(user) {
  const role = user?.role || 'owner';
  const userId = user?.id !== undefined ? String(user.id) : '1';
  return {
    'role': role,
    'x-user-id': userId
  };
}

// ── COMPLAINTS ──
export async function getOwnerComplaints(ownerId, user) {
  const response = await fetch(`${API_BASE_URL}/complaints/owner/${ownerId}`, {
    method: 'GET',
    headers: getHeaders(user)
  });
  if (!response.ok) throw new Error('Failed to load complaints');
  const data = await response.json();
  return (data || []).map(c => ({
    ...c,
    caption: c.description,
    image: c.photo
  }));
}

export async function getComplaintDetails(id, user) {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
    method: 'GET',
    headers: getHeaders(user)
  });
  if (!response.ok) throw new Error('Failed to load complaint details');
  const c = await response.json();
  return {
    ...c,
    caption: c.description,
    image: c.photo,
    issuedBy: 'Resident',
    submittedOn: c.submittedAt
  };
}

export async function createComplaint(formData, user) {
  // Multipart: DO NOT set Content-Type header so browser calculates boundary
  const headers = getHeaders(user);
  delete headers['Content-Type'];

  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to submit complaint');
  }

  return response.json();
}

// ── RATINGS ──
export async function getOwnerRatings(ownerId, complaintId, user) {
  const response = await fetch(`${API_BASE_URL}/ratings?ownerId=${ownerId}&complaintId=${complaintId}`, {
    method: 'GET',
    headers: {
      ...getHeaders(user),
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) return [];
  return response.json();
}

export async function submitOwnerRating(ratingData, user) {
  const response = await fetch(`${API_BASE_URL}/ratings`, {
    method: 'POST',
    headers: {
      ...getHeaders(user),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ratingData)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to submit rating');
  }

  return response.json();
}

// ── MAINTENANCE / PAYMENTS ──
export async function getOwnerPaymentsSummary(ownerId, user) {
  const response = await fetch(`${API_BASE_URL}/maintenance/owner/${ownerId}/summary`, {
    method: 'GET',
    headers: {
      ...getHeaders(user),
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) return { totalPaid: 0, pendingCount: 0, monthlyPaid: 0 };
  return response.json();
}

export async function getOwnerPayments(ownerId, user) {
  const response = await fetch(`${API_BASE_URL}/maintenance/owner/${ownerId}`, {
    method: 'GET',
    headers: {
      ...getHeaders(user),
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) return [];
  return response.json();
}

export async function submitTransactionId(maintenanceId, transactionId, user) {
  const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/submit-transaction`, {
    method: 'PATCH',
    headers: {
      ...getHeaders(user),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transactionId })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to submit transaction ID');
  }

  return response.json();
}
