/* ============================================================
   STATE — Global application state
   ============================================================ */
const AppState = {

  // Current page / route
  currentPage: 'dashboard',

  // User profile
  userProfile: {
    fullName: 'Operations Administrator',
    email: 'admin.operations@propsync.com',
    password: 'admin123',
    phone: '+91-9876543243',
    role: 'Super User',
    department: 'Operations Administration',
    joinDate: 'January 4, 2024',
    location: 'Green Valley Society',
    employeeId: 'ADM-016',
  },
  userProfileStorageKey: 'userProfile:admin.operations@propsync.com:super',

  // Sidebar toggle
  sidebarOpen: false,

  // User dropdown
  userDropdownOpen: false,

  // Active filter for notifications
  notifFilter: 'all',

  // Participants sort state
  participantSortBy: null,   // 'name' | 'id' | 'email'
  participantSortOrder: 'asc',
  participantRoleFilter: 'All Roles',
  participantSearch: '',

  // Complaints filter
  complaintsFilter: 'all',
  complaintsSearch: '',

  // Role being edited (id)
  editingRoleId: null,
  editedPermissions: [],

  // Selected participant for edit/view
  selectedParticipant: null,
  // Selected complaint
  selectedComplaint: null,
};

// LOAD USER PROFILE FROM STORAGE
(function () {
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } catch {}

  if (currentUser) {
    AppState.userProfileStorageKey = `userProfile:${currentUser.email}:super`;
    AppState.userProfile = {
      fullName: currentUser.name || AppState.userProfile.fullName,
      email: currentUser.email || AppState.userProfile.email,
      password: currentUser.password || 'admin123',
      phone: currentUser.phone || '+91-9876543243',
      role: 'Super User',
      department: currentUser.department || 'Operations Administration',
      joinDate: currentUser.createdAt || 'January 4, 2024',
      location: currentUser.communityName || 'Green Valley Society',
      employeeId: `ADM-${String(currentUser.id || 16).padStart(3, '0')}`,
    };
  }

  const savedUser = localStorage.getItem(AppState.userProfileStorageKey);
  if (savedUser) {
    try { AppState.userProfile = JSON.parse(savedUser); } catch (e) { /* use defaults */ }
  }
  AppState.userProfile.role = 'Super User';
  localStorage.setItem(AppState.userProfileStorageKey, JSON.stringify(AppState.userProfile));
})();
