// =============================================================
// Maintenance Manager – route paths
// The shared Sidebar (components/Sidebar.jsx) links to plain paths like
// "/dashboard", "/complaints", "/payment-history" ... so MM_BASE is "" by
// default. If the team later mounts the manager under "/manager", change it
// here only.
// =============================================================
export const MM_BASE = "/maintenance_manager";

export const MM_PATHS = {
  dashboard: `${MM_BASE}/dashboard`,
  complaints: `${MM_BASE}/complaints`,
  complaintDetails: (id) => `${MM_BASE}/complaint-details?id=${id}`,
  assignProvider: (id) => `${MM_BASE}/assign-provider?id=${id}`,
  serviceEstimate: `${MM_BASE}/service-estimate`,
  paymentHistory: `${MM_BASE}/payment-history`,
  maintenance: `${MM_BASE}/maintenance`,
  providerPerformance: `${MM_BASE}/provider-performance`,
  notifications: `${MM_BASE}/notifications`,
  profile: `${MM_BASE}/profile`,
};
