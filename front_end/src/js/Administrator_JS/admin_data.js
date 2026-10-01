/* ============================================================
   DATA — Participants, Roles, Complaints, Notifications
   ============================================================ */

/* ---- Participants ---- */
const INITIAL_PARTICIPANTS = [
  { id: 'P001', backendUserId: 1,  name: 'Raj Kumar',                email: 'raj.owner@propsync.com',                 role: 'Property Owner',      status: 'Active' },
  { id: 'P002', backendUserId: 2,  name: 'Anita Sharma',             email: 'anita.owner@propsync.com',               role: 'Property Owner',      status: 'Active' },
  { id: 'P003', backendUserId: 3,  name: 'Karan Mehta',              email: 'karan.owner@propsync.com',               role: 'Property Owner',      status: 'Active' },
  { id: 'P004', backendUserId: 4,  name: 'Priya Nair',               email: 'priya.owner@propsync.com',               role: 'Property Owner',      status: 'Active' },
  { id: 'P005', backendUserId: 5,  name: 'Vijay Singh',              email: 'vijay.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active' },
  { id: 'P006', backendUserId: 6,  name: 'Meera Joshi',              email: 'meera.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active' },
  { id: 'P007', backendUserId: 7,  name: 'Arjun Reddy',              email: 'arjun.manager@propsync.com',             role: 'Maintenance Manager', status: 'Active' },
  { id: 'P008', backendUserId: 8,  name: 'Neha Kapoor',              email: 'neha.manager@propsync.com',              role: 'Maintenance Manager', status: 'Active' },
  { id: 'P009', backendUserId: 9,  name: 'QuickFix Plumbing',        email: 'quickfix.plumbing@propsync.com',         role: 'Service Provider',    status: 'Active' },
  { id: 'P010', backendUserId: 10, name: 'BrightSpark Electricals',  email: 'brightspark.electrical@propsync.com',    role: 'Service Provider',    status: 'Active' },
  { id: 'P011', backendUserId: 11, name: 'CoolAir Services',         email: 'coolair.hvac@propsync.com',              role: 'Service Provider',    status: 'Active' },
  { id: 'P012', backendUserId: 12, name: 'CleanSweep Facility Care', email: 'cleansweep.sanitation@propsync.com',     role: 'Service Provider',    status: 'Active' },
  { id: 'P013', backendUserId: 13, name: 'Admin User',               email: 'admin.primary@propsync.com',             role: 'Administrator',       status: 'Active' },
  { id: 'P014', backendUserId: 14, name: 'System Administrator',     email: 'admin.system@propsync.com',              role: 'Administrator',       status: 'Active' },
  { id: 'P015', backendUserId: 15, name: 'Finance Administrator',    email: 'admin.finance@propsync.com',             role: 'Administrator',       status: 'Active' },
  { id: 'P016', backendUserId: 16, name: 'Operations Administrator', email: 'admin.operations@propsync.com',          role: 'Administrator',       status: 'Active' },
];

function getParticipants() {
  const saved = localStorage.getItem(participantStorageKey());
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function saveParticipants(list) {
  localStorage.setItem(participantStorageKey(), JSON.stringify(list));
}

function participantStorageKey() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user?.id) return `admin:participants:${user.id}`;
  } catch {}
  return 'admin:participants:anonymous';
}

function roleLabelFromApi(role) {
  const labels = {
    owner: 'Property Owner',
    service_provider: 'Service Provider',
    maintenance_manager: 'Maintenance Manager',
    manager: 'Maintenance Manager',
    admin: 'Administrator',
  };
  return labels[role] || role;
}

/**
 * Keep the participant list aligned with the API, not merely with the browser
 * that happened to approve the request. This makes an approved account appear
 * after a refresh, on another admin's browser, or after visiting the page later.
 */
async function refreshApprovedParticipantsFromBackend() {
  if (typeof refreshAdminParticipantsFromBackend === 'function') {
    return await refreshAdminParticipantsFromBackend();
  }
  return false;
}

function generateParticipantId(list) {
  const maxNum = list.reduce((max, p) => {
    const n = parseInt(p.id.substring(1));
    return n > max ? n : max;
  }, 0);
  return `P${String(maxNum + 1).padStart(3, '0')}`;
}

/* ---- Complaints ---- */
const INITIAL_COMPLAINTS = [
  { id:'C-1', title:'Water Leakage in Block A', description:'Continuous water leakage in corridor room 203 causing wet floors and damage.', serviceProvider:'Not Assigned', providerType:'Plumbing', property:'A-101 - Building A, Corridor 203', reportedBy:'Raj Kumar', reportedDate:'2024-03-08', status:'pending', priority:'high', estimatedCost: undefined },
  { id:'C-2', title:'Street Light Not Working', description:'Street light near the main gate has not been working for the past three days.', serviceProvider:'BrightSpark Electricals', providerType:'Electrical', property:'B-202 - Main Gate Area', reportedBy:'Anita Sharma', reportedDate:'2024-03-07', status:'approved', priority:'medium', estimatedCost: undefined },
  { id:'C-3', title:'Garbage Not Collected - Block C', description:'Garbage bins in Block C are overflowing and need immediate collection.', serviceProvider:'CleanSweep Facility Care', providerType:'Sanitation', property:'C-303 - Block C', reportedBy:'Karan Mehta', reportedDate:'2024-03-06', status:'estimate-approval', priority:'medium', estimatedCost:'₹3,200' },
  { id:'C-4', title:'Lift Not Working', description:'Lift is not working since two days, causing trouble for senior residents.', serviceProvider:'BrightSpark Electricals', providerType:'Elevator', property:'B-202 - Main Building', reportedBy:'Anita Sharma', reportedDate:'2024-03-05', status:'assigned', priority:'high', estimatedCost: undefined },
  { id:'C-5', title:'AC Not Cooling - Tower B, Apt 305', description:'Air conditioning unit has stopped cooling. Residents are facing discomfort.', serviceProvider:'CoolAir Services', providerType:'HVAC', property:'A-101 - Tower B, Apt 305', reportedBy:'Raj Kumar', reportedDate:'2024-03-04', status:'billed', priority:'high', estimatedCost:'₹4,700' },
  { id:'C-6', title:'Electrical Wiring Issue - Tower B', description:'Sparks from electrical wiring in common area corridor.', serviceProvider:'BrightSpark Electricals', providerType:'Electrical', property:'B-202 - Tower B, Corridor', reportedBy:'Anita Sharma', reportedDate:'2024-03-02', status:'closed', priority:'high', estimatedCost: undefined },
  { id:'C-7', title:'Paint Work Needed - Tower C', description:'Peeling paint on walls of Tower C common area needs repainting.', serviceProvider:'Not Assigned', providerType:'Painting', property:'A-101 - Tower C, Common Area', reportedBy:'Raj Kumar', reportedDate:'2024-03-01', status:'rejected', priority:'low', estimatedCost: undefined },
  { id:'C-8', title:'Door Lock Broken - Apt 401', description:'Main door lock is broken and cannot secure the apartment.', serviceProvider:'QuickFix Plumbing', providerType:'Carpentry', property:'D-404 - Tower A, Apt 401', reportedBy:'Priya Nair', reportedDate:'2024-03-09', status:'approved', priority:'medium', estimatedCost: undefined },
  { id:'C-9', title:'Basement Pipe Burst', description:'A pipe has burst in the basement parking area and water is pooling near electrical panels.', serviceProvider:'QuickFix Plumbing', providerType:'Plumbing', property:'C-303 - Basement Parking B2', reportedBy:'Karan Mehta', reportedDate:'2024-03-10', status:'ongoing', priority:'high', estimatedCost: undefined },
  { id:'C-10', title:'Lobby Camera Offline', description:'Security camera in Tower D lobby is offline and needs inspection.', serviceProvider:'BrightSpark Electricals', providerType:'Security', property:'D-404 - Tower D Lobby', reportedBy:'Priya Nair', reportedDate:'2024-03-11', status:'billed', priority:'medium', estimatedCost: undefined },
  { id:'C-11', title:'Clubhouse HVAC Noise', description:'The clubhouse HVAC unit is making loud noise during evening hours.', serviceProvider:'CoolAir Services', providerType:'HVAC', property:'A-101 - Clubhouse', reportedBy:'Raj Kumar', reportedDate:'2024-03-01', status:'paid', priority:'medium', estimatedCost: undefined },
  { id:'C-12', title:'Garden Waste Cleanup', description:'Garden waste has accumulated behind Tower C after trimming work.', serviceProvider:'CleanSweep Facility Care', providerType:'Sanitation', property:'C-303 - Tower C Garden', reportedBy:'Karan Mehta', reportedDate:'2024-03-01', status:'completed', priority:'low', estimatedCost: undefined },
];

const PS_ADMIN_OWNERS = {
  1: { name: 'Raj Kumar', email: 'raj.owner@propsync.com', unit: 'A-101' },
  2: { name: 'Anita Sharma', email: 'anita.owner@propsync.com', unit: 'B-202' },
  3: { name: 'Karan Mehta', email: 'karan.owner@propsync.com', unit: 'C-303' },
  4: { name: 'Priya Nair', email: 'priya.owner@propsync.com', unit: 'D-404' },
};

const PS_ADMIN_PROVIDERS = {
  9: { name: 'QuickFix Plumbing', type: 'Plumbing' },
  10: { name: 'BrightSpark Electricals', type: 'Electrical' },
  11: { name: 'CoolAir Services', type: 'HVAC' },
  12: { name: 'CleanSweep Facility Care', type: 'Sanitation' },
};

function getComplaints() {
  const saved = localStorage.getItem('admin:complaints');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return INITIAL_COMPLAINTS;
}

function saveComplaints(list) {
  localStorage.setItem('admin:complaints', JSON.stringify(list));
}

async function refreshAdminComplaintsFromBackend() {
  try {
    const res = await fetch('http://localhost:3000/complaints', {
      headers: { role: 'admin', 'x-user-id': String(getCurrentAdminUserId()) },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data)) return false;

    const mapped = data.map(c => {
      const owner = PS_ADMIN_OWNERS[c.ownerId] || { name: `Owner #${c.ownerId}`, unit: c.location || 'Unit -' };
      const provider = PS_ADMIN_PROVIDERS[c.assignedProviderId] || { name: c.assignedProviderId ? `Provider #${c.assignedProviderId}` : 'Not Assigned', type: c.category || 'General' };
      return {
        id: `C-${c.id}`,
        backendId: c.id,
        title: c.title,
        description: c.description,
        serviceProvider: provider.name,
        providerType: provider.type,
        property: c.location || owner.unit || 'Community Property',
        reportedBy: owner.name,
        reportedDate: c.submittedAt || new Date().toISOString().split('T')[0],
        status: c.status,
        priority: c.priority || 'medium',
        estimatedCost: c.estimateSubmitted ? '₹4,500' : undefined,
        rawComplaint: c,
      };
    });

    saveComplaints(mapped);
    return true;
  } catch (err) {
    console.error('Failed to load admin complaints from backend', err);
    return false;
  }
}

/* ---- Notifications ---- */
const INITIAL_NOTIFICATIONS = [
  { id:1, title:'New User Registration',          category:'User Management',      description:"A new user 'Jennifer Martinez' has registered as a Maintenance Manager. Account verification is pending admin approval.", timestamp:'1 hour ago',  isNew:true,  isRead:false, type:'info',    iconType:'user-plus' },
  { id:2, title:'New User Registration',          category:'User Management',      description:"A new user 'John Peterson' has registered as a Service Provider. Account verification is pending admin approval.",         timestamp:'2 hours ago', isNew:true,  isRead:false, type:'info',    iconType:'user-plus' },
  { id:3, title:'New User Registration',          category:'User Management',      description:"A new user 'Maria Garcia' has registered as a Property Owner. Account verification is pending admin approval.",            timestamp:'3 hours ago', isNew:true,  isRead:false, type:'info',    iconType:'user-plus' },
  { id:4, title:'System Update Required',         category:'System Maintenance',   description:'A critical system update is available. Please schedule maintenance window to apply security patches.',                     timestamp:'4 hours ago', isNew:true,  isRead:false, type:'warning', iconType:'alert' },
  { id:5, title:'Database Backup Completed',      category:'System',               description:'Automatic database backup completed successfully. Backup size: 2.4 GB. All data has been securely stored.',               timestamp:'1 day ago',   isNew:false, isRead:true,  type:'success', iconType:'check' },
];

function getNotifications() {
  const saved = localStorage.getItem('admin:notifications');
  const backendSaved = localStorage.getItem('admin:backendNotifications');
  let backendNotifs = [];
  if (backendSaved) {
    try { backendNotifs = JSON.parse(backendSaved); } catch { backendNotifs = []; }
  }

  const hiddenBackendIds = getHiddenBackendNotificationIds();
  const mergeUnique = (localNotifs) => {
    const local = Array.isArray(localNotifs) ? localNotifs : [];
    const localIds = new Set(local.map(n => String(n.id)));
    return [
      // Pending signup approvals must always be visible. Numeric notification
      // IDs are recreated when the in-memory API restarts, so a historical
      // delete/hidden cache must not suppress a new actionable request.
      ...backendNotifs.filter(n =>
        (n.requiresApproval || !hiddenBackendIds.includes(String(n.backendId))) &&
        !localIds.has(String(n.id)),
      ),
      ...local,
    ];
  };

  if (saved) {
    try { return mergeUnique(JSON.parse(saved)); } catch { return mergeUnique(INITIAL_NOTIFICATIONS); }
  }
  return mergeUnique(INITIAL_NOTIFICATIONS);
}

function saveNotifications(list) {
  localStorage.setItem('admin:notifications', JSON.stringify(list));
}

function getHiddenBackendNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem('admin:hiddenBackendNotifications')) || [];
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
    localStorage.setItem('admin:hiddenBackendNotifications', JSON.stringify(ids));
  }
}

function getAcceptedBackendNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem('admin:acceptedBackendNotifications')) || [];
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
    localStorage.setItem('admin:acceptedBackendNotifications', JSON.stringify(ids));
  }
}

function updateCachedBackendNotification(backendId, patch) {
  const saved = localStorage.getItem('admin:backendNotifications');
  if (!saved || !backendId) return;
  let list = [];
  try { list = JSON.parse(saved); } catch { return; }
  list = list.map(n => String(n.backendId) === String(backendId) ? { ...n, ...patch } : n);
  localStorage.setItem('admin:backendNotifications', JSON.stringify(list));
}

function getCurrentAdminUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.id) return user.id;
  } catch {}
  return 13;
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

function mapBackendNotification(n, pendingUserIds = new Set()) {
  const requiresApproval = Boolean(n.relatedUserId) && pendingUserIds.has(Number(n.relatedUserId));
  return {
    id: `backend-${n.id}`,
    backendId: n.id,
    requestedUserId: n.relatedUserId,
    title: n.type === 'custom' && n.relatedUserId ? 'New User Registration' : (n.title || 'System Update'),
    category: n.recipient === 'admin' ? 'Administrator' : 'System',
    description: n.message,
    timestamp: formatBackendNotifTime(n.createdAt),
    isNew: n.status === 'unread',
    isRead: n.status === 'read',
    // The pending state is authoritative: a read notification for an already
    // approved/rejected account must never show an Accept button again.
    requiresApproval,
    type: 'info',
    iconType: 'user-plus',
  };
}

async function refreshBackendNotifications() {
  let notifications = [];
  let pendingUsers = [];

  try {
    const res = await fetch(`http://localhost:3000/notifications?userId=${getCurrentAdminUserId()}`, {
      headers: { role: 'admin', 'x-user-id': String(getCurrentAdminUserId()) },
    });
    if (res.ok) notifications = await res.json();
  } catch (error) {
    console.error('Failed to load Administrator notifications', error);
  }

  try {
    const pendingResponse = await fetch('http://localhost:3000/users/pending', {
      headers: { role: 'admin', 'x-user-id': String(getCurrentAdminUserId()) },
    });
    if (pendingResponse.ok) {
      pendingUsers = await pendingResponse.json();
      // Cache the pending users so Accept buttons survive a failed fetch on next poll
      localStorage.setItem('admin:pendingUsersCache', JSON.stringify(pendingUsers));
    } else {
      // Fall back to cache — avoids losing Accept buttons on a transient error
      try { pendingUsers = JSON.parse(localStorage.getItem('admin:pendingUsersCache')) || []; } catch { pendingUsers = []; }
    }
  } catch (error) {
    console.error('Failed to load pending Administrator approvals', error);
    // Fall back to cache so the Accept button is not lost on a network blip
    try { pendingUsers = JSON.parse(localStorage.getItem('admin:pendingUsersCache')) || []; } catch { pendingUsers = []; }
  }

  const pendingUserIds = new Set(pendingUsers.map((user) => Number(user.id)));
  const mapped = notifications
    .filter(n => n.recipient === 'admin')
    .map(n => mapBackendNotification(n, pendingUserIds));
  const notifiedUserIds = new Set(mapped.map(n => Number(n.requestedUserId)));

  // This fallback protects the UI from an old/missing notification record.
  pendingUsers.forEach((user) => {
    if (notifiedUserIds.has(Number(user.id))) return;
    mapped.unshift({
      id: `pending-user-${user.id}`,
      backendId: '',
      requestedUserId: user.id,
      title: 'New User Registration',
      category: 'Administrator',
      description: `New user ${user.name} (${user.email}) requested signup as ${user.role}.`,
      timestamp: 'Pending approval',
      isNew: true,
      isRead: false,
      requiresApproval: true,
      type: 'info',
      iconType: 'user-plus',
    });
  });

  localStorage.setItem('admin:backendNotifications', JSON.stringify(mapped));
  return mapped;
}
