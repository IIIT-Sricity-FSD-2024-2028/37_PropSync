export type Role =
  | 'owner'
  | 'service_provider'
  | 'maintenance_manager'
  | 'administrator'
  | 'super_user';

export type Status =
  | 'Pending'
  | 'Approved'
  | 'Assigned'
  | 'Rejected'
  | 'In Progress'
  | 'Completed'
  | 'Payment Pending';

// ─── ENTITIES ──────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: 'Active' | 'Inactive';
  propertyUnit?: string;
  communityName?: string;
  specialty?: string;
  experience?: string;
  phone?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: Status;
  subStatus?: string;
  priority: 'Low' | 'Medium' | 'High';
  location: string;
  issuedBy: string;
  assignedTo?: string | null;
  serviceProviderQueue: string[];
  rejectionReason?: string | null;
  estimatedCost?: number;
  reportedDate: string;
  deadline?: string | null;
  image?: string | null;
}

export interface ServiceEstimate {
  id: string;
  complaintId: string;
  providerId: string;
  providerEmail: string;
  cost: number;
  completionTime: string;
  workDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface ServiceBill {
  id: string;
  complaintId: string;
  providerEmail: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  submittedAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
}

export interface Payment {
  id: string;
  ownerId: string;
  ownerEmail: string;
  month: string;
  amount: number;
  status: 'pending' | 'paid';
  paidOn?: string | null;
  receipt?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  forRole: Role | 'all';
  forUser?: string;
  forCategory?: string; // ✅ added
  isRead: boolean;
  createdAt: string;
}

export interface ProviderRating {
  id: string;
  providerEmail: string;
  complaintId: string;
  ratedBy: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

// ─── SEED DATA ─────────────────────────────────────
const _users: User[] = [
  // Admin
  {
    id: 'U001',
    name: 'Admin User',
    email: 'admin@communityhub.com',
    password: 'admin123',
    role: 'administrator',
    status: 'Active',
    phone: '9876543210',
    createdAt: '2026-05-01T09:00:00Z',
  },

  // Maintenance Manager
  {
    id: 'U002',
    name: 'Ravi Kumar',
    email: 'manager@communityhub.com',
    password: 'manager123',
    role: 'maintenance_manager',
    status: 'Active',
    phone: '9876543211',
    experience: '8 years',
    createdAt: '2026-05-01T09:10:00Z',
  },

  // Service Providers
  {
    id: 'U003',
    name: 'Suresh Electrician',
    email: 'suresh.electrician@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Electrical',
    experience: '5 years',
    phone: '9876543212',
    createdAt: '2026-05-01T09:20:00Z',
  },
  {
    id: 'U004',
    name: 'Ramesh Plumber',
    email: 'ramesh.plumber@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Plumbing',
    experience: '6 years',
    phone: '9876543213',
    createdAt: '2026-05-01T09:30:00Z',
  },
  {
    id: 'U005',
    name: 'Anil Carpenter',
    email: 'anil.carpenter@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Carpentry',
    experience: '4 years',
    phone: '9876543214',
    createdAt: '2026-05-01T09:40:00Z',
  },
  {
    id: 'U006',
    name: 'Priya Cleaner',
    email: 'priya.cleaner@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Cleaning',
    experience: '3 years',
    phone: '9876543215',
    createdAt: '2026-05-01T09:50:00Z',
  },
  {
    id: 'U007',
    name: 'Kiran Painter',
    email: 'kiran.painter@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Painting',
    experience: '7 years',
    phone: '9876543216',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'U008',
    name: 'Deepak AC Technician',
    email: 'deepak.ac@communityhub.com',
    password: 'service123',
    role: 'service_provider',
    status: 'Active',
    specialty: 'AC Repair',
    experience: '5 years',
    phone: '9876543217',
    createdAt: '2026-05-01T10:10:00Z',
  },

  // Owners
  {
    id: 'U009',
    name: 'Amit Sharma',
    email: 'amit.sharma@communityhub.com',
    password: 'owner123',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'A-101',
    communityName: 'Green Valley Residency',
    phone: '9876543218',
    createdAt: '2026-05-01T10:20:00Z',
  },
  {
    id: 'U010',
    name: 'Neha Reddy',
    email: 'neha.reddy@communityhub.com',
    password: 'owner123',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'A-102',
    communityName: 'Green Valley Residency',
    phone: '9876543219',
    createdAt: '2026-05-01T10:30:00Z',
  },
  {
    id: 'U011',
    name: 'Rahul Verma',
    email: 'rahul.verma@communityhub.com',
    password: 'owner123',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'B-201',
    communityName: 'Green Valley Residency',
    phone: '9876543220',
    createdAt: '2026-05-01T10:40:00Z',
  },
  {
    id: 'U012',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@communityhub.com',
    password: 'owner123',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'B-202',
    communityName: 'Green Valley Residency',
    phone: '9876543221',
    createdAt: '2026-05-01T10:50:00Z',
  },
  {
    id: 'U013',
    name: 'Vikram Singh',
    email: 'vikram.singh@communityhub.com',
    password: 'owner123',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'C-301',
    communityName: 'Green Valley Residency',
    phone: '9876543222',
    createdAt: '2026-05-01T11:00:00Z',
  },
  {
    id: 'U014',
    name: 'John Mitchell',
    email: 'owner1@propsync.com',
    password: '1234',
    role: 'owner',
    status: 'Active',
    propertyUnit: 'A-101',
    communityName: 'Green Valley',
    phone: '+91-9000000001',
    createdAt: '2026-01-01',
  },
  {
    id: 'U015',
    name: 'Sarah Chen',
    email: 'provider1@propsync.com',
    password: '1234',
    role: 'service_provider',
    status: 'Active',
    specialty: 'Plumbing',
    experience: '8',
    phone: '+91-9000000002',
    createdAt: '2026-01-02',
  },
];

export const COMPLAINTS_DATA: Complaint[] = [
  {
    id: 'C001',
    title: 'Leaking Kitchen Pipe',
    description:
      'Significant water leakage under the sink in the main kitchen area.',
    category: 'Plumbing',
    status: 'Pending',
    priority: 'High',
    location: 'Building A - Apt 304',
    issuedBy: 'owner1@propsync.com',
    assignedTo: null,
    serviceProviderQueue: [],
    reportedDate: '2026-05-01',
    image: 'https://example.com/images/leak.jpg',
  },
  {
    id: 'C002',
    title: 'Flickering Hallway Lights',
    description:
      'The lights in the second-floor corridor are flickering constantly.',
    category: 'Electrical',
    status: 'Approved',
    priority: 'Medium',
    location: 'Building B - Level 2 Corridor',
    issuedBy: 'owner1@propsync.com',
    assignedTo: null,
    serviceProviderQueue: [],
    reportedDate: '2026-05-02',
  },
  {
    id: 'C003',
    title: 'AC Not Cooling',
    description: 'The lobby AC unit is running but not cooling properly.',
    category: 'HVAC',
    status: 'Rejected',
    priority: 'High',
    location: 'Main Lobby',
    issuedBy: 'owner1@propsync.com',
    assignedTo: null,
    serviceProviderQueue: [],
    rejectionReason: 'Missing AC serial number for warranty validation.',
    reportedDate: '2026-05-03',
  },
  {
    id: 'C004',
    title: 'Broken Door Handle',
    description: 'The entrance door handle is loose and needs fixing.',
    category: 'Carpentry',
    status: 'Completed',
    priority: 'Low',
    location: 'Building C - Entrance',
    issuedBy: 'owner1@propsync.com',
    assignedTo: 'provider4@propsync.com',
    serviceProviderQueue: [],
    reportedDate: '2026-04-28',
    deadline: '2026-05-01',
  },
  {
    id: 'C005',
    title: 'Water Overflow in Tank',
    description: 'The overhead water tank is overflowing continuously.',
    category: 'Plumbing',
    status: 'Approved',
    priority: 'High',
    location: 'Building A - Terrace',
    issuedBy: 'owner1@propsync.com',
    assignedTo: null,
    serviceProviderQueue: [],
    reportedDate: '2026-05-04',
  },
  {
    id: 'C006',
    title: 'Elevator Maintenance',
    description: 'Routine inspection and maintenance for lift A.',
    category: 'Elevator',
    status: 'In Progress',
    priority: 'Medium',
    location: 'Building B - Lift A',
    issuedBy: 'owner1@propsync.com',
    assignedTo: 'provider1@propsync.com',
    serviceProviderQueue: [],
    reportedDate: '2026-05-01',
    deadline: '2026-05-08',
  },
  {
    id: 'C007',
    title: 'Lobby Painting',
    description: 'Repainting the reception and waiting lobby area.',
    category: 'Painting',
    status: 'Payment Pending',
    priority: 'Low',
    location: 'Main Lobby',
    issuedBy: 'owner1@propsync.com',
    assignedTo: 'provider2@propsync.com',
    serviceProviderQueue: [],
    reportedDate: '2026-04-25',
    deadline: '2026-05-02',
  },
];

export const NOTIFICATIONS_DATA: Notification[] = [
  {
    id: 'N001',
    title: 'Welcome to PropSync',
    message: 'Thank you for joining our community management platform.',
    type: 'system',
    forRole: 'all',
    isRead: false,
    createdAt: '2026-05-01T08:00:00Z',
  },
  {
    id: 'N002',
    title: 'New Complaint Filed',
    message: 'A new plumbing issue (C001) has been reported.',
    type: 'complaint',
    forRole: 'maintenance_manager',
    isRead: false,
    createdAt: '2026-05-01T10:30:00Z',
  },
  {
    id: 'N003',
    title: 'Complaint Rejected',
    message: 'Your AC repair request (C003) was rejected.',
    type: 'complaint',
    forRole: 'owner',
    forUser: 'owner1@propsync.com',
    isRead: true,
    createdAt: '2026-05-03T14:20:00Z',
  },
  {
    id: 'N004',
    title: 'Complaint Approved',
    message: 'A new Electrical complaint (C002) has been approved.',
    type: 'complaint',
    forRole: 'service_provider',
    forCategory: 'Electrical',
    isRead: false,
    createdAt: '2026-05-02T09:15:00Z',
  },
  {
    id: 'N005',
    title: 'Complaint Approved',
    message: 'A new Plumbing complaint (C005) has been approved.',
    type: 'complaint',
    forRole: 'service_provider',
    forCategory: 'Plumbing',
    isRead: false,
    createdAt: '2026-05-04T11:00:00Z',
  },
  {
    id: 'N006',
    title: 'Service Completed',
    message: 'Complaint C004 has been marked as completed.',
    type: 'complaint',
    forRole: 'owner',
    forUser: 'owner1@propsync.com',
    isRead: false,
    createdAt: '2026-05-01T17:30:00Z',
  },
];

export const RATINGS_DATA: ProviderRating[] = [
  {
    id: 'R001',
    providerEmail: 'provider1@propsync.com',
    complaintId: 'C005',
    ratedBy: 'owner1@propsync.com',
    rating: 5,
    feedback: 'Quick response and fixed the water overflow issue perfectly.',
    createdAt: '2026-05-05T10:00:00Z',
  },
  {
    id: 'R002',
    providerEmail: 'provider2@propsync.com',
    complaintId: 'C002',
    ratedBy: 'owner1@propsync.com',
    rating: 4,
    feedback: 'Resolved the hallway light issue efficiently.',
    createdAt: '2026-05-03T15:00:00Z',
  },
  {
    id: 'R003',
    providerEmail: 'provider4@propsync.com',
    complaintId: 'C004',
    ratedBy: 'owner1@propsync.com',
    rating: 5,
    feedback: 'Very professional and fixed the door handle neatly.',
    createdAt: '2026-05-02T16:00:00Z',
  },
];

// ─── DATABASE ──────────────────────────────────────

export const db = {
  users: _users,
  complaints: [...COMPLAINTS_DATA],
  notifications: [...NOTIFICATIONS_DATA],
  ratings: [...RATINGS_DATA],
  estimates: [] as ServiceEstimate[],
  bills: [] as ServiceBill[],
  payments: [] as Payment[],
};

// ─── GETTERS / SETTERS ─────────────────────────────

export const getUsers = (): User[] => db.users;
export const setUsers = (users: User[]): void => {
  db.users = users;
};

export const getComplaints = (): Complaint[] => db.complaints;
export const setComplaints = (complaints: Complaint[]): void => {
  db.complaints = complaints;
};

export const getRatings = (): ProviderRating[] => db.ratings;
export const setRatings = (ratings: ProviderRating[]): void => {
  db.ratings = ratings;
};

export const getEstimates = (): ServiceEstimate[] => db.estimates;
export const setEstimates = (estimates: ServiceEstimate[]): void => {
  db.estimates = estimates;
};

export const getBills = (): ServiceBill[] => db.bills;
export const setBills = (bills: ServiceBill[]): void => {
  db.bills = bills;
};

export const getPayments = (): Payment[] => db.payments;
export const setPayments = (payments: Payment[]): void => {
  db.payments = payments;
};

export const getNotifications = (): Notification[] => db.notifications;
export const setNotifications = (notifications: Notification[]): void => {
  db.notifications = notifications;
};

// ─── ID GENERATOR ──────────────────────────────────

export function generateId(prefix: string, list: any[]): string {
  const nums = list
    .map((x) => (x.id ? parseInt(x.id.replace(/\D/g, '')) : 0))
    .filter((n) => !isNaN(n));

  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}
