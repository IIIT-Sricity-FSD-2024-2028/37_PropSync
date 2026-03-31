/* ============================================================
   STATE — Global application state
   ============================================================ */
const AppState = {

  // Current page / route
  currentPage: 'dashboard',

  // User profile
  userProfile: {
    fullName: 'Sarah Mitchell',
    email: 'sarah.mitchell@propsync.com',
    password: 'admin@123',
    phone: '+1 (555) 987-6543',
    role: 'Administrator',
    department: 'IT Operations',
    joinDate: 'January 15, 2024',
    location: 'San Francisco, CA',
    employeeId: 'ADM-2024-001',
  },

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

  // Selected participant for edit/view
  selectedParticipant: null,
  // Selected complaint
  selectedComplaint: null,
};

// LOAD USER PROFILE FROM STORAGE
(function () {
  const savedUser = localStorage.getItem('userProfile');
  if (savedUser) {
    try { AppState.userProfile = JSON.parse(savedUser); } catch (e) { /* use defaults */ }
  }

  // Ensure role is always administrator, in case old localStorage had a legacy value.
  AppState.userProfile.role = 'Administrator';
  localStorage.setItem('userProfile', JSON.stringify(AppState.userProfile));
})();