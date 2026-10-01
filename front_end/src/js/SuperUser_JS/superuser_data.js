/* ============================================================
   DATA — Participants, Roles, Complaints, Notifications
   ============================================================ */

/* ---- Participants ---- */
const INITIAL_PARTICIPANTS = [
  // Green Valley Society
  { id: 'P001', backendUserId: 1,  name: 'Raj Kumar',                email: 'raj.owner@propsync.com',                 role: 'Property Owner',      status: 'Active', community: 'Green Valley Society', propertyUnit: 'A-101' },
  { id: 'P002', backendUserId: 2,  name: 'Anita Sharma',             email: 'anita.owner@propsync.com',               role: 'Property Owner',      status: 'Active', community: 'Green Valley Society', propertyUnit: 'B-202' },
  { id: 'P003', backendUserId: 3,  name: 'Karan Mehta',              email: 'karan.owner@propsync.com',               role: 'Property Owner',      status: 'Active', community: 'Green Valley Society', propertyUnit: 'C-303' },
  { id: 'P004', backendUserId: 4,  name: 'Priya Nair',               email: 'priya.owner@propsync.com',               role: 'Property Owner',      status: 'Active', community: 'Green Valley Society', propertyUnit: 'D-404' },
  { id: 'P005', backendUserId: 5,  name: 'Vijay Singh',              email: 'vijay.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active', community: 'Green Valley Society', block: 'A' },
  { id: 'P006', backendUserId: 6,  name: 'Meera Joshi',              email: 'meera.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active', community: 'Green Valley Society', block: 'B' },
  { id: 'P007', backendUserId: 7,  name: 'Arjun Reddy',              email: 'arjun.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active', community: 'Green Valley Society', block: 'C' },
  { id: 'P008', backendUserId: 8,  name: 'Neha Kapoor',              email: 'neha.manager@propsync.com',              role: 'Maintenance Manager', status: 'Active', community: 'Green Valley Society', block: 'D' },
  { id: 'P009', backendUserId: 9,  name: 'QuickFix Plumbing',        email: 'quickfix.plumbing@propsync.com',         role: 'Service Provider',    status: 'Active', category: 'Plumbing' },
  { id: 'P010', backendUserId: 10, name: 'BrightSpark Electricals',  email: 'brightspark.electrical@propsync.com',    role: 'Service Provider',    status: 'Active', category: 'Electrical' },
  { id: 'P011', backendUserId: 11, name: 'CoolAir Services',         email: 'coolair.hvac@propsync.com',              role: 'Service Provider',    status: 'Active', category: 'HVAC' },
  { id: 'P012', backendUserId: 12, name: 'CleanSweep Facility Care', email: 'cleansweep.sanitation@propsync.com',     role: 'Service Provider',    status: 'Active', category: 'Sanitation' },
  { id: 'P013', backendUserId: 13, name: 'Green Valley Administrator', email: 'admin.greenvalley@propsync.com',       role: 'Administrator',       status: 'Active', community: 'Green Valley Society' },

  // Sunrise Residency
  { id: 'P014', backendUserId: 14, name: 'Sunrise Administrator',     email: 'admin.sunrise@propsync.com',              role: 'Administrator',       status: 'Active', community: 'Sunrise Residency' },
  { id: 'P015', backendUserId: 16, name: 'Aarav Patel',              email: 'aarav.sunrise.owner@propsync.com',       role: 'Property Owner',      status: 'Active', community: 'Sunrise Residency', propertyUnit: 'A-101' },
  { id: 'P016', backendUserId: 17, name: 'Diya Shah',                email: 'diya.sunrise.owner@propsync.com',         role: 'Property Owner',      status: 'Active', community: 'Sunrise Residency', propertyUnit: 'B-202' },
  { id: 'P017', backendUserId: 18, name: 'Rohan Verma',              email: 'rohan.sunrise.owner@propsync.com',       role: 'Property Owner',      status: 'Active', community: 'Sunrise Residency', propertyUnit: 'C-303' },
  { id: 'P018', backendUserId: 19, name: 'Isha Gupta',               email: 'isha.sunrise.owner@propsync.com',        role: 'Property Owner',      status: 'Active', community: 'Sunrise Residency', propertyUnit: 'D-404' },
  { id: 'P019', backendUserId: 20, name: 'Sanjay Rao',               email: 'sanjay.sunrise.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Sunrise Residency', block: 'A' },
  { id: 'P020', backendUserId: 21, name: 'Kavita Menon',             email: 'kavita.sunrise.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Sunrise Residency', block: 'B' },
  { id: 'P021', backendUserId: 22, name: 'Nikhil Bansal',            email: 'nikhil.sunrise.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Sunrise Residency', block: 'C' },
  { id: 'P022', backendUserId: 23, name: 'Pooja Iyer',               email: 'pooja.sunrise.manager@propsync.com',      role: 'Maintenance Manager', status: 'Active', community: 'Sunrise Residency', block: 'D' },

  // Lakeview Apartments
  { id: 'P023', backendUserId: 15, name: 'Lakeview Administrator',    email: 'admin.lakeview@propsync.com',             role: 'Administrator',       status: 'Active', community: 'Lakeview Apartments' },
  { id: 'P024', backendUserId: 24, name: 'Aditya Nair',              email: 'aditya.lakeview.owner@propsync.com',      role: 'Property Owner',      status: 'Active', community: 'Lakeview Apartments', propertyUnit: 'A-101' },
  { id: 'P025', backendUserId: 25, name: 'Sneha Reddy',              email: 'sneha.lakeview.owner@propsync.com',       role: 'Property Owner',      status: 'Active', community: 'Lakeview Apartments', propertyUnit: 'B-202' },
  { id: 'P026', backendUserId: 26, name: 'Varun Sethi',              email: 'varun.lakeview.owner@propsync.com',       role: 'Property Owner',      status: 'Active', community: 'Lakeview Apartments', propertyUnit: 'C-303' },
  { id: 'P027', backendUserId: 27, name: 'Maya Krishnan',            email: 'maya.lakeview.owner@propsync.com',        role: 'Property Owner',      status: 'Active', community: 'Lakeview Apartments', propertyUnit: 'D-404' },
  { id: 'P028', backendUserId: 28, name: 'Rakesh Sinha',             email: 'rakesh.lakeview.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Lakeview Apartments', block: 'A' },
  { id: 'P029', backendUserId: 29, name: 'Anjali Das',               email: 'anjali.lakeview.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Lakeview Apartments', block: 'B' },
  { id: 'P030', backendUserId: 30, name: 'Dev Malhotra',             email: 'dev.lakeview.manager@propsync.com',      role: 'Maintenance Manager', status: 'Active', community: 'Lakeview Apartments', block: 'C' },
  { id: 'P031', backendUserId: 31, name: 'Shreya Pillai',            email: 'shreya.lakeview.manager@propsync.com',     role: 'Maintenance Manager', status: 'Active', community: 'Lakeview Apartments', block: 'D' },
];

function normalizeBackendUserToParticipant(u, idx) {
  let roleLabel = 'Property Owner';
  if (u.role === 'admin') roleLabel = 'Administrator';
  else if (u.role === 'maintenance_manager') roleLabel = 'Maintenance Manager';
  else if (u.role === 'service_provider') roleLabel = 'Service Provider';
  else if (u.role === 'super_user') roleLabel = 'Super User';

  return {
    id: `P${String(idx + 1).padStart(3, '0')}`,
    backendUserId: u.id,
    name: u.name || 'User',
    email: u.email || '',
    role: roleLabel,
    status: u.approvalStatus === 'rejected' ? 'Rejected' : u.approvalStatus === 'pending' ? 'Pending' : 'Active',
    community: u.communityName,
    propertyUnit: u.propertyUnit,
    block: u.block,
    category: u.category,
    phone: u.phone,
  };
}

function getParticipants() {
  const saved = localStorage.getItem('superUser:participants');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_PARTICIPANTS.length) {
        return parsed;
      }
    } catch {}
  }
  localStorage.setItem('superUser:participants', JSON.stringify(INITIAL_PARTICIPANTS));
  return INITIAL_PARTICIPANTS;
}

async function refreshParticipantsFromBackend() {
  try {
    const res = await fetch('http://localhost:3000/users', {
      headers: { role: 'super_user', 'x-user-id': '0' },
    });
    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        const mapped = users.map((u, i) => normalizeBackendUserToParticipant(u, i));
        localStorage.setItem('superUser:participants', JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (e) {
    console.warn('Backend users could not be refreshed, using cached seed list', e);
  }
  return getParticipants();
}

function saveParticipants(list) {
  localStorage.setItem('superUser:participants', JSON.stringify(list));
}

function generateParticipantId(list) {
  const maxNum = list.reduce((max, p) => {
    const n = parseInt(p.id.substring(1));
    return n > max ? n : max;
  }, 0);
  return `P${String(maxNum + 1).padStart(3, '0')}`;
}

/* ---- Roles ---- */
const INITIAL_ROLES = [
  {
    id: 1, name: 'Owner', userCount: '12 users',
    description: 'Property owners who report issues, pay maintenance charges, and rate service completion.',
    iconType: 'home', bgClass: 'bg-blue-100', textClass: 'text-blue-600', borderClass: 'owner',
    permissions: [
      'Report maintenance issues with photos',
      'Track complaint progress & resolution workflow',
      'Pay monthly maintenance charges online',
      'Confirm task completion & rate service quality',
      'Receive status & maintenance alert notifications',
    ],
  },
  {
    id: 2, name: 'Maintenance Manager', userCount: '12 users',
    description: 'Managers who review complaints, assign service providers, and manage monthly maintenance funds.',
    iconType: 'wrench', bgClass: 'bg-green-100', textClass: 'text-green-600', borderClass: 'manager',
    permissions: [
      'Review submitted complaints & set resolution deadlines',
      'Assign service providers from the interest queue',
      'Generate & send monthly maintenance costs to owners',
      'Review & approve/reject contractor service estimates',
      'Pay service bills & track maintenance finances',
      'Monitor contractor performance & ratings',
    ],
  },
  {
    id: 3, name: 'Service Provider', userCount: '4 users',
    description: 'External licensed contractors who express interest, provide estimates, and perform maintenance work.',
    iconType: 'briefcase', bgClass: 'bg-orange-100', textClass: 'text-orange-600', borderClass: 'provider',
    permissions: [
      'Browse approved available complaints in real-time',
      'Express interest in available maintenance tasks',
      'Accept assigned tasks & view complaint details',
      'Submit detailed service estimates with cost breakdown',
      'Mark tasks completed & upload resolution proof',
      'Submit service bills for manager payment',
      'View customer reviews & performance ratings',
    ],
  },
  {
    id: 4, name: 'Administrator', userCount: '3 users',
    description: 'Society administrators who govern community participants, review records, and oversee operations.',
    iconType: 'shield', bgClass: 'bg-purple-100', textClass: 'text-purple-600', borderClass: 'admin',
    permissions: [
      'Approve or reject new user registrations in their society',
      'Manage community participants & access status',
      'View community-wide maintenance complaints & history',
      'Review monthly maintenance collections & payment records',
      'Monitor service provider assignments & performance',
      'Receive administrator alerts & registration requests',
    ],
  },
];

function getRoles() {
  const saved = localStorage.getItem('superUser:roles');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const hasAdmin = parsed.some(r => r.name === 'Administrator');
      if (hasAdmin) {
        return parsed.map(r => {
          const initial = INITIAL_ROLES.find(ir => ir.id === r.id);
          return { ...initial, ...r };
        });
      }
    } catch {}
  }
  localStorage.setItem('superUser:roles', JSON.stringify(INITIAL_ROLES));
  return INITIAL_ROLES;
}

function saveRoles(list) {
  localStorage.setItem('superUser:roles', JSON.stringify(list));
}

/* ---- Complaints ---- */
const INITIAL_COMPLAINTS = [
  { id:'C-1', title:'Water Leakage in Block A', description:'Continuous water leakage in corridor room 203 causing wet floors and damage.', serviceProvider:'Not Assigned', providerType:'Plumbing', property:'A-101 - Green Valley Society, Block A', reportedBy:'Raj Kumar', reportedDate:'2024-03-08', status:'pending', priority:'high', estimatedCost: undefined },
  { id:'C-2', title:'Street Light Not Working', description:'Street light near the main gate has not been working for the past three days.', serviceProvider:'BrightSpark Electricals', providerType:'Electrical', property:'B-202 - Green Valley Society, Block B', reportedBy:'Anita Sharma', reportedDate:'2024-03-07', status:'approved', priority:'medium', estimatedCost: undefined },
  { id:'C-3', title:'Garbage Not Collected - Block C', description:'Garbage bins in Block C are overflowing and need immediate collection.', serviceProvider:'CleanSweep Facility Care', providerType:'Sanitation', property:'C-303 - Green Valley Society, Block C', reportedBy:'Karan Mehta', reportedDate:'2024-03-06', status:'estimate-approval', priority:'medium', estimatedCost:'₹3,200' },
  { id:'C-4', title:'Lift Not Working', description:'Lift is not working since two days, causing trouble for senior residents.', serviceProvider:'BrightSpark Electricals', providerType:'Elevator', property:'B-202 - Green Valley Society, Block B', reportedBy:'Anita Sharma', reportedDate:'2024-03-05', status:'assigned', priority:'high', estimatedCost: undefined },
  { id:'C-5', title:'AC Not Cooling - Tower B, Apt 305', description:'Air conditioning unit has stopped cooling. Residents are facing discomfort.', serviceProvider:'CoolAir Services', providerType:'HVAC', property:'A-101 - Green Valley Society, Block A', reportedBy:'Raj Kumar', reportedDate:'2024-03-04', status:'billed', priority:'high', estimatedCost:'₹4,700' },
  { id:'C-6', title:'Electrical Wiring Issue - Tower B', description:'Sparks from electrical wiring in common area corridor.', serviceProvider:'BrightSpark Electricals', providerType:'Electrical', property:'B-202 - Green Valley Society, Block B', reportedBy:'Anita Sharma', reportedDate:'2024-03-02', status:'closed', priority:'high', estimatedCost: undefined },
  { id:'C-7', title:'Paint Work Needed - Tower C', description:'Peeling paint on walls of Tower C common area needs repainting.', serviceProvider:'Not Assigned', providerType:'Painting', property:'A-101 - Green Valley Society, Block A', reportedBy:'Raj Kumar', reportedDate:'2024-03-01', status:'rejected', priority:'low', estimatedCost: undefined },
  { id:'C-8', title:'Door Lock Broken - Apt 401', description:'Main door lock is broken and cannot secure the apartment.', serviceProvider:'QuickFix Plumbing', providerType:'Carpentry', property:'D-404 - Green Valley Society, Block D', reportedBy:'Priya Nair', reportedDate:'2024-03-09', status:'approved', priority:'medium', estimatedCost: undefined },
  { id:'C-9', title:'Basement Pipe Burst', description:'A pipe has burst in the basement parking area and water is pooling near electrical panels.', serviceProvider:'QuickFix Plumbing', providerType:'Plumbing', property:'C-303 - Green Valley Society, Block C', reportedBy:'Karan Mehta', reportedDate:'2024-03-10', status:'ongoing', priority:'high', estimatedCost: undefined },
  { id:'C-10', title:'Lobby Camera Offline', description:'Security camera in Tower D lobby is offline and needs inspection.', serviceProvider:'BrightSpark Electricals', providerType:'Security', property:'D-404 - Green Valley Society, Block D', reportedBy:'Priya Nair', reportedDate:'2024-03-11', status:'billed', priority:'medium', estimatedCost: undefined },
  { id:'C-11', title:'Clubhouse HVAC Noise', description:'The clubhouse HVAC unit is making loud noise during evening hours.', serviceProvider:'CoolAir Services', providerType:'HVAC', property:'A-101 - Green Valley Society, Block A', reportedBy:'Raj Kumar', reportedDate:'2024-03-01', status:'paid', priority:'medium', estimatedCost: undefined },
  { id:'C-12', title:'Garden Waste Cleanup', description:'Garden waste has accumulated behind Tower C after trimming work.', serviceProvider:'CleanSweep Facility Care', providerType:'Sanitation', property:'C-303 - Green Valley Society, Block C', reportedBy:'Karan Mehta', reportedDate:'2024-03-01', status:'completed', priority:'low', estimatedCost: undefined },
];

function normalizeBackendComplaint(c) {
  const providerNames = {
    9: 'QuickFix Plumbing',
    10: 'BrightSpark Electricals',
    11: 'CoolAir Services',
    12: 'CleanSweep Facility Care',
  };
  const providerTypes = {
    9: 'Plumbing',
    10: 'Electrical',
    11: 'HVAC',
    12: 'Sanitation',
  };

  const providerName = c.assignedProviderId ? (providerNames[c.assignedProviderId] || `Provider #${c.assignedProviderId}`) : 'Not Assigned';
  const providerType = c.category || (c.assignedProviderId ? providerTypes[c.assignedProviderId] : 'General');

  return {
    id: `C-${c.id}`,
    rawId: c.id,
    title: c.title || 'Maintenance Request',
    description: c.description || 'No description provided.',
    serviceProvider: providerName,
    providerType: providerType,
    property: c.location || 'Green Valley Society',
    reportedBy: c.reportedBy || `Owner #${c.ownerId || 1}`,
    reportedDate: c.createdAt ? c.createdAt.split('T')[0] : '2024-03-01',
    status: c.status || 'pending',
    priority: (c.priority || 'medium').toLowerCase(),
    estimatedCost: c.estimatedCost ? `₹${Number(c.estimatedCost).toLocaleString('en-IN')}` : undefined,
    photo: c.photo,
    deadline: c.deadline,
  };
}

function getComplaints() {
  const saved = localStorage.getItem('superUser:complaints');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem('superUser:complaints', JSON.stringify(INITIAL_COMPLAINTS));
  return INITIAL_COMPLAINTS;
}

async function refreshComplaintsFromBackend() {
  try {
    const res = await fetch('http://localhost:3000/complaints', {
      headers: { role: 'super_user', 'x-user-id': '0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(normalizeBackendComplaint);
        localStorage.setItem('superUser:complaints', JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (e) {
    console.warn('Backend complaints could not be fetched, using cached complaints', e);
  }
  return getComplaints();
}

function saveComplaints(list) {
  localStorage.setItem('superUser:complaints', JSON.stringify(list));
}

/* ---- Notifications ---- */
const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'New User Registration', category: 'User Management', description: "A new user 'Dr. Aris Thorne' has requested registration as an Administrator. Account verification is pending Super User approval.", timestamp: '1 hour ago', isNew: true, isRead: false, type: 'info', iconType: 'user-plus', requestedRole: 'Administrator' },
  { id: 4, title: 'System Update Required', category: 'System Maintenance', description: 'A critical security update (v6.2.0) is available for deployment across all society nodes.', timestamp: '4 hours ago', isNew: true, isRead: false, type: 'warning', iconType: 'alert' },
  { id: 5, title: 'Role Permissions Updated', category: 'Security', description: "The 'Administrator' role permissions have been successfully updated with enhanced access controls.", timestamp: '1 day ago', isNew: false, isRead: false, type: 'success', iconType: 'shield' },
  { id: 6, title: 'Database Backup Completed', category: 'System', description: 'Automatic database backup completed successfully. All society records and payment tables securely verified.', timestamp: '1 day ago', isNew: false, isRead: true, type: 'success', iconType: 'check' },
  { id: 7, title: 'Configuration Changes Detected', category: 'System Configuration', description: 'System configuration settings have been updated by Super User. Settings successfully synced across clusters.', timestamp: '2 days ago', isNew: false, isRead: true, type: 'info', iconType: 'settings' },
];

function isAllowedSuperUserNotification(n) {
  if (n.title === 'New User Registration' || n.category === 'User Approval' || n.type === 'custom') {
    const desc = (n.description || n.message || '').toLowerCase();
    // Do NOT show New User Registration for Property Owner, Maintenance Manager, or Service Provider
    if (desc.includes('property owner') || desc.includes('maintenance manager') || desc.includes('service provider') || desc.includes('owner') || desc.includes('manager')) {
      if (!desc.includes('administrator') && !desc.includes('admin')) {
        return false;
      }
    }
    // Must be administrator registration
    return desc.includes('admin') || desc.includes('administrator');
  }
  return true;
}

function getNotifications() {
  const saved = localStorage.getItem('superUser:notifications');
  const backendSaved = localStorage.getItem('superUser:backendNotifications');
  let backendNotifs = [];
  if (backendSaved) {
    try { backendNotifs = JSON.parse(backendSaved); } catch { backendNotifs = []; }
  }

  const hiddenBackendIds = getHiddenBackendNotificationIds();
  const mergeUnique = (localNotifs) => {
    const local = Array.isArray(localNotifs) ? localNotifs : [];
    const localIds = new Set(local.map(n => String(n.id)));
    const combined = [
      ...backendNotifs.filter(n => !hiddenBackendIds.includes(String(n.backendId)) && !localIds.has(String(n.id))),
      ...local,
    ];
    return combined.filter(isAllowedSuperUserNotification);
  };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return mergeUnique(parsed);
    } catch {
      return mergeUnique(INITIAL_NOTIFICATIONS);
    }
  }
  return mergeUnique(INITIAL_NOTIFICATIONS);
}

function saveNotifications(list) {
  localStorage.setItem('superUser:notifications', JSON.stringify(list));
}

function getHiddenBackendNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem('superUser:hiddenBackendNotifications')) || [];
  } catch {
    return [];
  }
}

function hideBackendNotification(backendId) {
  if (!backendId) return;
  const ids = getHiddenBackendNotificationIds();
  const id = String(backendId);
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('superUser:hiddenBackendNotifications', JSON.stringify(ids));
  }
}

function getAcceptedBackendNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem('superUser:acceptedBackendNotifications')) || [];
  } catch {
    return [];
  }
}

function acceptBackendNotification(backendId) {
  if (!backendId) return;
  const ids = getAcceptedBackendNotificationIds();
  const id = String(backendId);
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('superUser:acceptedBackendNotifications', JSON.stringify(ids));
  }
}

function updateCachedBackendNotification(backendId, patch) {
  const saved = localStorage.getItem('superUser:backendNotifications');
  if (!saved || !backendId) return;
  let list = [];
  try { list = JSON.parse(saved); } catch { return; }
  list = list.map(n => String(n.backendId) === String(backendId) ? { ...n, ...patch } : n);
  localStorage.setItem('superUser:backendNotifications', JSON.stringify(list));
}

function getCurrentAdminUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.id) return user.id;
  } catch {}
  return 0;
}

function formatBackendNotifTime(createdAt) {
  if (!createdAt) return 'Just now';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function mapBackendNotification(n) {
  const acceptedIds = getAcceptedBackendNotificationIds();
  return {
    id: `backend-${n.id}`,
    backendId: n.id,
    requestedUserId: n.relatedUserId,
    title: n.type === 'custom' ? 'New User Registration' : 'System Notification',
    category: n.recipient === 'super_user' ? 'Admin Approval' : 'System',
    description: n.message,
    timestamp: formatBackendNotifTime(n.createdAt),
    isNew: n.status === 'unread',
    isRead: n.status === 'read',
    accepted: acceptedIds.includes(String(n.id)),
    type: 'info',
    iconType: 'user-plus',
  };
}

async function refreshBackendNotifications() {
  try {
    const res = await fetch(`http://localhost:3000/notifications?userId=${getCurrentAdminUserId()}`, {
      headers: { role: 'super_user', 'x-user-id': String(getCurrentAdminUserId()) },
    });
    if (!res.ok) return [];

    const notifications = await res.json();
    const mapped = notifications
      .filter(n => n.recipient === 'super_user')
      .map(mapBackendNotification)
      .filter(isAllowedSuperUserNotification);
    localStorage.setItem('superUser:backendNotifications', JSON.stringify(mapped));
    return mapped;
  } catch (error) {
    console.error('Failed to load backend admin notifications', error);
    return [];
  }
}

