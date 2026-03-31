/* ============================================================
   DATA — Participants, Roles, Complaints, Notifications
   ============================================================ */

/* ---- Participants ---- */
const INITIAL_PARTICIPANTS = [
  { id: 'P001', name: 'John Mitchell',   email: 'john.mitchell@email.com',   role: 'Property Owner',      status: 'Active'   },
  { id: 'P002', name: 'Sarah Chen',      email: 'sarah.chen@email.com',      role: 'Service Provider',    status: 'Active'   },
  { id: 'P003', name: 'David Rodriguez', email: 'david.rodriguez@email.com', role: 'Maintenance Manager', status: 'Active'   },
  { id: 'P004', name: 'Emily Thompson',  email: 'emily.thompson@email.com',  role: 'Property Owner',      status: 'Inactive' },
  { id: 'P005', name: 'Michael Johnson', email: 'michael.johnson@email.com', role: 'Service Provider',    status: 'Active'   },
  { id: 'P006', name: 'Lisa Anderson',   email: 'lisa.anderson@email.com',   role: 'Maintenance Manager', status: 'Active'   },
  { id: 'P007', name: 'Robert Williams', email: 'robert.williams@email.com', role: 'Property Owner',      status: 'Active'   },
];

function getParticipants() {
  const saved = localStorage.getItem('participants');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('participants', JSON.stringify(INITIAL_PARTICIPANTS));
  return INITIAL_PARTICIPANTS;
}

function saveParticipants(list) {
  localStorage.setItem('participants', JSON.stringify(list));
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
  { id:'CPL001', title:'Pipeline Leakage in Bathroom',   description:'Major water leakage detected in the main bathroom pipeline causing water damage to the floor.',  serviceProvider:'John Smith',    providerType:'Plumber',         property:'Building A - Unit 301', reportedBy:'Sarah Mitchell', reportedDate:'2026-03-25', status:'ongoing',            priority:'high',   estimatedCost: undefined },
  { id:'CPL002', title:'Electrical Short Circuit',       description:'Frequent power outages in kitchen area due to faulty wiring.',                                     serviceProvider:'Mike Johnson',  providerType:'Electrician',     property:'Building B - Unit 205', reportedBy:'David Brown',    reportedDate:'2026-03-24', status:'estimate-approval',  priority:'high',   estimatedCost: '$450' },
  { id:'CPL003', title:'AC Not Cooling Properly',        description:'Air conditioning unit not maintaining temperature, suspected refrigerant leak.',                    serviceProvider:'Robert Lee',    providerType:'HVAC Technician', property:'Building C - Unit 102', reportedBy:'Emma Wilson',    reportedDate:'2026-03-23', status:'completed',          priority:'medium', estimatedCost: undefined },
  { id:'CPL004', title:'Door Lock Malfunction',          description:'Main entrance door lock is jammed and needs replacement.',                                         serviceProvider:'Tom Anderson',  providerType:'Locksmith',       property:'Building A - Unit 405', reportedBy:'Michael Davis',  reportedDate:'2026-03-22', status:'to-be-resolved',     priority:'medium', estimatedCost: undefined },
  { id:'CPL005', title:'Water Heater Not Working',       description:'Water heater completely stopped functioning, no hot water available.',                             serviceProvider:'John Smith',    providerType:'Plumber',         property:'Building D - Unit 501', reportedBy:'Lisa Anderson',  reportedDate:'2026-03-26', status:'ongoing',            priority:'high',   estimatedCost: undefined },
  { id:'CPL006', title:'Window Pane Broken',             description:'Living room window pane cracked, needs immediate replacement.',                                    serviceProvider:'James Wilson',  providerType:'Carpenter',       property:'Building B - Unit 308', reportedBy:'Sarah Mitchell', reportedDate:'2026-03-21', status:'completed',          priority:'low',    estimatedCost: undefined },
  { id:'CPL007', title:'Drainage System Blocked',        description:'Kitchen sink drainage completely blocked causing water overflow.',                                  serviceProvider:'John Smith',    providerType:'Plumber',         property:'Building C - Unit 210', reportedBy:'Daniel Garcia',  reportedDate:'2026-03-27', status:'estimate-approval',  priority:'high',   estimatedCost: '$280' },
  { id:'CPL008', title:'Paint Peeling from Walls',       description:'Bedroom walls showing severe paint peeling due to moisture.',                                      serviceProvider:'Carlos Martinez',providerType:'Painter',        property:'Building A - Unit 105', reportedBy:'Jennifer Lee',   reportedDate:'2026-03-20', status:'to-be-resolved',     priority:'low',    estimatedCost: undefined },
];

function getComplaints() {
  const saved = localStorage.getItem('complaints');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('complaints', JSON.stringify(INITIAL_COMPLAINTS));
  return INITIAL_COMPLAINTS;
}

function saveComplaints(list) {
  localStorage.setItem('complaints', JSON.stringify(list));
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
  const saved = localStorage.getItem('notifications');
  if (saved) {
    try { return JSON.parse(saved); } catch { return INITIAL_NOTIFICATIONS; }
  }
  return INITIAL_NOTIFICATIONS;
}

function saveNotifications(list) {
  localStorage.setItem('notifications', JSON.stringify(list));
}