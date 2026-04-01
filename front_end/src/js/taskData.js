

/* ─────────────────────────────────────────────
   STORAGE KEYS
───────────────────────────────────────────── */
const TASKS_KEY          = 'propSyncTasks';
const TASKS_VERSION_KEY  = 'propSyncTasksVersion';
const COMPLAINTS_KEY     = 'propSyncComplaints';
const PROFILE_KEY        = 'propSyncProfile';
const NOTIFS_KEY         = 'propSyncNotifications';
const CURRENT_VERSION    = '2.0';

/* ─────────────────────────────────────────────
   INITIAL DATA
───────────────────────────────────────────── */
const initialTasksData = {
  'C-2401': {
    id:'C-2401', issueType:'Plumbing', title:'Severe Pipe Leak',
    description:'There is a severe water leak coming from the main pipe in the bathroom. Water is accumulating rapidly and causing damage to the floor and adjacent walls.',
    image:'https://images.unsplash.com/photo-1706206140285-fd36d93aaa83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    location:'Building A, Apt 205', deadline:'Mar 8, 2026', priority:'High',
    assignedDate:'Mar 5, 2026', estimateSubmitted:true, status:'In Progress',
    estimate:{ cost:'$450.00', completionTime:'4 hours', workDescription:'Will replace the damaged pipe section, seal all connections, test for leaks, and ensure proper water flow.', uploadedFile:'pipe-leak-estimate.pdf' },
    progress:{ assigned:true, estimateSent:true, approved:true, inProgress:true, completed:false }
  },
  'C-2402': {
    id:'C-2402', issueType:'Plumbing', title:'Completely Clogged Drain',
    description:'The kitchen sink drain is completely blocked and water is not draining at all. This has been an ongoing issue for the past 2 days.',
    image:'https://images.unsplash.com/photo-1772397546294-a2554a8a9793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    location:'Building B, Apt 310', deadline:'Mar 9, 2026', priority:'High',
    assignedDate:'Mar 6, 2026', estimateSubmitted:true, status:'Estimate Submitted',
    estimate:{ cost:'$250.00', completionTime:'2 hours', workDescription:'Will use professional drain cleaning equipment to clear the blockage and test water flow.', uploadedFile:'drain-cleaning-estimate.pdf' },
    progress:{ assigned:true, estimateSent:true, approved:false, inProgress:false, completed:false }
  },
  'C-2403': {
    id:'C-2403', issueType:'Plumbing', title:'Dripping Faucet Issue',
    description:'The bathroom faucet has been constantly dripping for over a week. This is wasting water and the constant dripping sound is disturbing.',
    image:'https://images.unsplash.com/photo-1542855368-ca6ea825bca2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    location:'Building C, Apt 102', deadline:'Mar 11, 2026', priority:'Medium',
    assignedDate:'Mar 4, 2026', estimateSubmitted:true, status:'Waiting for Materials',
    estimate:{ cost:'$180.00', completionTime:'1.5 hours', workDescription:'Will replace the worn-out washer and O-rings, clean the valve seat, and test for proper shutoff.', uploadedFile:'faucet-repair-estimate.pdf' },
    progress:{ assigned:true, estimateSent:true, approved:true, inProgress:true, completed:false }
  },
  'C-2398': {
    id:'C-2398', issueType:'Plumbing', title:'Toilet Not Flushing',
    description:'The toilet is not flushing properly. Water level in the bowl remains high but does not flush.',
    image:'https://images.unsplash.com/photo-1539062680227-66125f17d777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    location:'Building A, Apt 401', deadline:'Mar 7, 2026', priority:'High',
    assignedDate:'Mar 3, 2026', estimateSubmitted:true, status:'Completed',
    estimate:{ cost:'$200.00', completionTime:'2 hours', workDescription:'Will replace the faulty flush mechanism, adjust water level, and ensure proper flushing operation.', uploadedFile:'toilet-repair-estimate.pdf' },
    progress:{ assigned:true, estimateSent:true, approved:true, inProgress:true, completed:true }
  },
  'C-2405': {
    id:'C-2405', issueType:'Plumbing', title:'Burst Pipe in Basement',
    description:'Major pipe burst in the basement causing flooding. Immediate action required to prevent extensive water damage.',
    image:'https://images.unsplash.com/photo-1708561159079-d4d9a40881f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    location:'Building E, Basement', deadline:'Mar 8, 2026', priority:'High',
    assignedDate:'Mar 7, 2026', estimateSubmitted:false, status:'Assigned',
    progress:{ assigned:true, estimateSent:false, approved:false, inProgress:false, completed:false }
  }
};

const initialComplaintsData = [
  { id:'C-2401', issueType:'Plumbing', title:'Severe Pipe Leak', description:'Water leak detected in the main bathroom. The leak is coming from under the sink and needs immediate attention to prevent further water damage to the property.', imageUrl:'https://images.unsplash.com/photo-1581720604719-ee1b1a4e44b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building A, Apt 205', deadline:'Mar 8, 2026', urgency:'High', accepted:false, rejected:false },
  { id:'C-2402', issueType:'Plumbing', title:'Completely Clogged Drain', description:'Kitchen sink drain is completely blocked. Water is not draining at all and backing up into the sink. Requires professional drain cleaning service as soon as possible.', imageUrl:'https://images.unsplash.com/photo-1772397546294-a2554a8a9793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building B, Apt 310', deadline:'Mar 9, 2026', urgency:'High', accepted:false, rejected:false },
  { id:'C-2403', issueType:'Plumbing', title:'Dripping Faucet Issue', description:'Bathroom faucet continuously dripping throughout the day and night. The issue is wasting water and causing an annoying noise.', imageUrl:'https://images.unsplash.com/photo-1549273091-7ffa3280e3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building C, Apt 102', deadline:'Mar 11, 2026', urgency:'Medium', accepted:false, rejected:false },
  { id:'C-2404', issueType:'Plumbing', title:'Toilet Not Flushing', description:'Toilet in the master bathroom is not flushing properly. Water fills up but does not drain. May require adjustment or replacement of internal mechanisms.', imageUrl:'https://images.unsplash.com/photo-1720886526989-2bd3988ef53d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building A, Apt 401', deadline:'Mar 10, 2026', urgency:'High', accepted:false, rejected:false },
  { id:'C-2405', issueType:'Plumbing', title:'Water Heater Leak', description:'Small leak observed around the base of the water heater unit. Water is pooling on the floor and needs immediate inspection to prevent equipment damage.', imageUrl:'https://images.unsplash.com/photo-1729986694893-facaf4bce2e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building D, Apt 501', deadline:'Mar 12, 2026', urgency:'Medium', accepted:false, rejected:false },
  { id:'C-2406', issueType:'Plumbing', title:'Shower Drain Slow', description:'Shower drain is draining very slowly, causing water to pool during showers. Hair and debris buildup suspected.', imageUrl:'https://images.unsplash.com/photo-1692911436905-ec0f5a6cf910?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600', location:'Building B, Apt 208', deadline:'Mar 13, 2026', urgency:'Low', accepted:false, rejected:false },
];

const initialProfile = {
  name:'Sai', initials:'S',
  email:'sai@example.com', phone:'+1 (555) 123-4567',
  category:'Plumbing', experience:'8',
  locations:'Downtown, Westside, Eastville', spId:'SP-2401'
};

const initialNotifications = [
  { id:'1', type:'new_complaint', title:'New Complaint Available',     message:'A new plumbing complaint has been posted in your category. Complaint C-2405: Burst Pipe in Basement.',                    timestamp:'2 hours ago', read:false, complaintId:'C-2405' },
  { id:'2', type:'deadline',      title:'Deadline Approaching',        message:'The deadline for complaint C-2402 is approaching. Due date: Mar 9, 2026.',                                                   timestamp:'4 hours ago', read:false, complaintId:'C-2402' },
  { id:'3', type:'approval',      title:'Estimate Approved',           message:'Your service estimate for complaint C-2398 has been approved by the maintenance manager. You can now proceed with the work.',timestamp:'1 day ago',   read:false, complaintId:'C-2398' },
  { id:'4', type:'completion',    title:'Task Completed Successfully', message:'Complaint C-2398 has been marked as completed. The property owner will be notified.',                                         timestamp:'1 day ago',   read:true,  complaintId:'C-2398' },
  { id:'5', type:'assignment',    title:'New Task Assigned',           message:'Complaint C-2401 has been assigned to you. Please review the details and submit an estimate.',                                timestamp:'2 days ago',  read:true,  complaintId:'C-2401' },
  { id:'6', type:'deadline',      title:'Deadline Reminder',           message:'Reminder: Complaint C-2403 is due on Mar 10, 2026. Please ensure timely completion.',                                         timestamp:'3 days ago',  read:true,  complaintId:'C-2403' },
  { id:'7', type:'new_complaint', title:'New Complaint Available',     message:'A new plumbing complaint has been posted. Complaint C-2400: Leaking Kitchen Faucet.',                                         timestamp:'4 days ago',  read:true,  complaintId:'C-2400' },
  { id:'8', type:'approval',      title:'Estimate Approved',           message:'Your service estimate for complaint C-2401 has been approved. Total amount: $450.00.',                                        timestamp:'5 days ago',  read:true,  complaintId:'C-2401' },
];

/* ─────────────────────────────────────────────
   AUTO-INIT (version-gated reset)
───────────────────────────────────────────── */
(function _initStorage() {
  if (localStorage.getItem(TASKS_VERSION_KEY) !== CURRENT_VERSION) {
    localStorage.setItem(TASKS_KEY,         JSON.stringify(initialTasksData));
    localStorage.setItem(COMPLAINTS_KEY,    JSON.stringify(initialComplaintsData));
    localStorage.setItem(PROFILE_KEY,       JSON.stringify(initialProfile));
    localStorage.setItem(NOTIFS_KEY,        JSON.stringify(initialNotifications));
    localStorage.setItem(TASKS_VERSION_KEY, CURRENT_VERSION);
  }
})();

/* ─────────────────────────────────────────────
   TASKS API
───────────────────────────────────────────── */
function getAllTasks() {
  return JSON.parse(localStorage.getItem(TASKS_KEY));
}
function getTask(taskId) {
  return getAllTasks()[taskId] || null;
}
function updateTask(taskId, updates) {
  const tasks = getAllTasks();

  if (!tasks[taskId]) return;

  const currentTask = tasks[taskId];
  const currentStatus = currentTask.status;
  const newStatus = updates.status;

  // Allowed transitions
  const validTransitions = {
    "Assigned": ["In Progress"],
    "In Progress": ["Waiting for Materials", "Completed"],
    "Waiting for Materials": ["In Progress"],
    "Completed": [] // no further changes
  };

  // If status is being updated, validate it
  if (newStatus && currentStatus !== newStatus) {
    const allowedNext = validTransitions[currentStatus] || [];

    if (!allowedNext.includes(newStatus)) {
      alert(`Invalid status change from "${currentStatus}" to "${newStatus}"`);
      return; // stop update
    }
  }

  // If valid → update
  tasks[taskId] = { ...currentTask, ...updates };

  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
function submitEstimate(taskId, estimate) {
  const tasks = getAllTasks();
  if (tasks[taskId]) {
    tasks[taskId] = {
      ...tasks[taskId],
      estimateSubmitted: true,
      status: 'Estimate Submitted',
      estimate,
      progress: { ...tasks[taskId].progress, estimateSent: true }
    };
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    addNotification({
      type:'assignment',
      title:'Estimate Submitted',
      message:`Your estimate for complaint ${taskId} has been submitted and is awaiting approval.`,
      complaintId: taskId
    });
  }
}
function getTasksArray() {
  return Object.values(getAllTasks());
}
function addTask(complaint) {
  const tasks = getAllTasks();
  if (tasks[complaint.id]) {
    // Already in assigned tasks — just mark accepted
    return;
  }
  tasks[complaint.id] = {
    id: complaint.id,
    issueType: complaint.issueType,
    title: complaint.title,
    description: complaint.description,
    image: complaint.imageUrl,
    location: complaint.location,
    deadline: complaint.deadline,
    priority: complaint.urgency,
    assignedDate: new Date().toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }),
    estimateSubmitted: false,
    status: 'Assigned',
    progress:{ assigned:true, estimateSent:false, approved:false, inProgress:false, completed:false }
  };
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

/* ─────────────────────────────────────────────
   COMPLAINTS API
───────────────────────────────────────────── */
function getAllComplaints() {
  return JSON.parse(localStorage.getItem(COMPLAINTS_KEY));
}
function saveComplaints(list) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
}
function acceptComplaint(id) {
  const list = getAllComplaints();
  const c = list.find(x => x.id === id);
  if (c && !c.accepted) {
    c.accepted = true;
    saveComplaints(list);
    addTask(c);
    addNotification({
      type:'assignment',
      title:'Complaint Accepted',
      message:`You accepted complaint ${id}. It has been added to your Assigned Tasks.`,
      complaintId: id
    });
  }
}
function rejectComplaint(id) {
  saveComplaints(getAllComplaints().filter(x => x.id !== id));
}

/* ─────────────────────────────────────────────
   PROFILE API
───────────────────────────────────────────── */
function getProfile() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY));
}
function saveProfile(data) {
  const parts = (data.name || '').trim().split(/\s+/);
  data.initials = parts.map(p => p[0]).join('').toUpperCase().slice(0,2) || 'U';
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

/* ─────────────────────────────────────────────
   NOTIFICATIONS API
───────────────────────────────────────────── */
function getNotifications() {
  return JSON.parse(localStorage.getItem(NOTIFS_KEY));
}
function saveNotifications(list) {
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(list));
}
function addNotification(partial) {
  const list = getNotifications();
  list.unshift({
    id: Date.now().toString(),
    type: partial.type || 'assignment',
    title: partial.title,
    message: partial.message,
    timestamp: 'Just now',
    read: false,
    complaintId: partial.complaintId || null
  });
  saveNotifications(list);
}
function markNotifRead(id) {
  const list = getNotifications();
  const n = list.find(x => x.id === id);
  if (n) { n.read = true; saveNotifications(list); }
}
function markAllNotifsRead() {
  saveNotifications(getNotifications().map(n => ({ ...n, read:true })));
}
function deleteNotification(id) {
  saveNotifications(getNotifications().filter(n => n.id !== id));
}
function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}

/* ─────────────────────────────────────────────
   URL HELPERS
───────────────────────────────────────────── */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ─────────────────────────────────────────────
   BADGE HELPERS
───────────────────────────────────────────── */
function priorityClass(p) {
  return { High:'badge-priority-high', Medium:'badge-priority-medium', Low:'badge-priority-low' }[p] || 'badge-gray';
}
function statusClass(s) {
  return {
    'Assigned':'badge-status-assigned',
    'In Progress':'badge-status-in-progress',
    'Completed':'badge-status-completed',
    'Estimate Submitted':'badge-status-estimate',
    'Waiting for Materials':'badge-status-waiting'
  }[s] || 'badge-gray';
}

/* ─────────────────────────────────────────────
   STAR RENDERER
───────────────────────────────────────────── */
function renderStars(rating, size=14) {
  let h = '<span style="display:inline-flex;gap:2px;">';
  for (let i=1;i<=5;i++) {
    h += `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#F59E0B" stroke-width="1.5" ${i<=rating?'fill="#F59E0B"':'fill="none"'}/></svg>`;
  }
  return h + '</span>';
}

/* ─────────────────────────────────────────────
   SHELL — sidebar + header
───────────────────────────────────────────── */
function initShell(activePage) {
  const profile = getProfile();
  const initials = profile.initials || profile.name[0].toUpperCase();
  const unread  = getUnreadCount();

  const pages = {
    dashboard:     { label:'Dashboard',            href:'../service_provider/index.html' },
    complaints:    { label:'Available Complaints', href:'../service_provider/available-complaints.html' },
    tasks:         { label:'Assigned Tasks',        href:'../service_provider/assigned-tasks.html' },
    ratings:       { label:'Ratings & Feedback',   href:'../service_provider/ratings-feedback.html' },
    notifications: { label:'Notifications',         href:'../service_provider/notifications.html' },
    profile:       { label:'Profile',               href:'../service_provider/profile.html' },
  };

  const navIcons = {
    dashboard:     `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    complaints:    `<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
    tasks:         `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    ratings:       `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    notifications: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    profile:       `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  };

  const iconColors = { dashboard:'blue', complaints:'yellow', tasks:'green', ratings:'gold', notifications:'red', profile:'blue' };

  const navHTML = Object.entries(pages).map(([key,{label,href}]) => `
    <a href="${href}" class="nav-item ${activePage===key?'active':''}">
      <span class="nav-icon ${iconColors[key]}">${navIcons[key]}</span>
      <span>${label}</span>
    </a>
  `).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app-shell" id="app-shell">
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
          <div class="sidebar-header">
            <img src="../../public/image.png" alt="PropSync" class="sidebar-logo"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span style="display:none;color:#fff;font-size:1.2rem;font-weight:800;letter-spacing:-0.5px;">PropSync</span>
            <button class="sidebar-close-btn" id="sidebar-close">
              <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <nav class="sidebar-nav">${navHTML}</nav>
          <div class="sidebar-divider"></div>
          <button class="sidebar-logout" id="logout-btn">
            <span class="logout-icon">→</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div class="main-wrap">
        <header class="top-header">
          <div class="header-left">
            <button class="menu-btn" id="menu-btn">
              <svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/></svg>
            </button>
            <img src="../../public/image.png" alt="PropSync" class="header-logo"
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span style="display:none;font-size:1.1rem;font-weight:800;color:#293543;">PropSync</span>
          </div>
          <div class="header-right">
            <button class="notif-btn" onclick="location.href='../service_provider/notifications.html'" title="Notifications" style="position:relative;">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ${unread > 0 ? `<span class="notif-dot"></span>` : ''}
            </button>
            <button class="profile-btn" onclick="location.href='../service_provider/profile.html'" title="Profile">
              <span class="profile-btn-name">SAI</span>
              <span class="profile-avatar">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
            </button>
          </div>
        </header>
        <main class="page-content" id="page-content">
  `);

  document.body.insertAdjacentHTML('beforeend', `</main></div></div>`);

  // Wire sidebar
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  document.getElementById('menu-btn').addEventListener('click', () => {
    sidebar.classList.add('open'); backdrop.classList.add('open');
  });
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  backdrop.addEventListener('click', closeSidebar);
  function closeSidebar() {
    sidebar.classList.remove('open'); backdrop.classList.remove('open');
  }

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
      location.href = '../index.html';
    }
  });
}
