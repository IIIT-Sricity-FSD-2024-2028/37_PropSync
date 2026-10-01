import { Injectable } from '@nestjs/common';
import type { ApprovalStatus, User } from './users.service';
import { UserRole } from './dto/user.dto';

@Injectable()
export class UsersRepository {
  /** Communities available to new community-scoped accounts. */
  private readonly communities = [
    'Green Valley Society',
    'Sunrise Residency',
    'Lakeview Apartments',
  ];

  private users: User[] = (
    [
      {
        id: 1,
        name: 'Raj Kumar',
        email: 'raj.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876a43210',
        role: UserRole.Owner,
        propertyUnit: 'A-101',
        communityName: 'Green Valley Society',
        createdAt: '2024-01-10',
      },
      {
        id: 2,
        name: 'Anita Sharma',
        email: 'anita.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543211',
        role: UserRole.Owner,
        propertyUnit: 'B-202',
        communityName: 'Green Valley Society',
        createdAt: '2024-01-12',
      },
      {
        id: 3,
        name: 'Karan Mehta',
        email: 'karan.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543212',
        role: UserRole.Owner,
        propertyUnit: 'C-303',
        communityName: 'Green Valley Society',
        createdAt: '2024-01-14',
      },
      {
        id: 4,
        name: 'Priya Nair',
        email: 'priya.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543213',
        role: UserRole.Owner,
        propertyUnit: 'D-404',
        communityName: 'Green Valley Society',
        createdAt: '2024-01-16',
      },
      {
        id: 5,
        name: 'Vijay Singh',
        email: 'vijay.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543220',
        role: UserRole.MaintenanceManager,
        communityName: 'Green Valley Society',
        block: 'A',
        createdAt: '2024-01-05',
      },
      {
        id: 6,
        name: 'Meera Joshi',
        email: 'meera.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543221',
        role: UserRole.MaintenanceManager,
        communityName: 'Green Valley Society',
        block: 'B',
        createdAt: '2024-01-06',
      },
      {
        id: 7,
        name: 'Arjun Reddy',
        email: 'arjun.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543222',
        role: UserRole.MaintenanceManager,
        communityName: 'Green Valley Society',
        block: 'C',
        createdAt: '2024-01-07',
      },
      {
        id: 8,
        name: 'Neha Kapoor',
        email: 'neha.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543223',
        role: UserRole.MaintenanceManager,
        communityName: 'Green Valley Society',
        block: 'D',
        createdAt: '2024-01-08',
      },
      {
        id: 9,
        name: 'QuickFix Plumbing',
        email: 'quickfix.plumbing@propsync.com',
        password: 'password123',
        phone: '+91-9876543230',
        role: UserRole.ServiceProvider,
        category: 'Plumbing',
        createdAt: '2024-01-08',
      },
      {
        id: 10,
        name: 'BrightSpark Electricals',
        email: 'brightspark.electrical@propsync.com',
        password: 'password123',
        phone: '+91-9876543231',
        role: UserRole.ServiceProvider,
        category: 'Electrical',
        createdAt: '2024-01-09',
      },
      {
        id: 11,
        name: 'CoolAir Services',
        email: 'coolair.hvac@propsync.com',
        password: 'password123',
        phone: '+91-9876543232',
        role: UserRole.ServiceProvider,
        category: 'HVAC',
        createdAt: '2024-01-10',
      },
      {
        id: 12,
        name: 'CleanSweep Facility Care',
        email: 'cleansweep.sanitation@propsync.com',
        password: 'password123',
        phone: '+91-9876543233',
        role: UserRole.ServiceProvider,
        category: 'Sanitation',
        createdAt: '2024-01-11',
      },
      {
        id: 13,
        name: 'Green Valley Administrator',
        email: 'admin.greenvalley@propsync.com',
        password: 'admin123',
        role: UserRole.Admin,
        communityName: 'Green Valley Society',
        createdAt: '2024-01-01',
      },
      {
        id: 14,
        name: 'Sunrise Administrator',
        email: 'admin.sunrise@propsync.com',
        password: 'admin123',
        role: UserRole.Admin,
        communityName: 'Sunrise Residency',
        createdAt: '2024-01-01',
      },
      {
        id: 15,
        name: 'Lakeview Administrator',
        email: 'admin.lakeview@propsync.com',
        password: 'admin123',
        role: UserRole.Admin,
        communityName: 'Lakeview Apartments',
        createdAt: '2024-01-01',
      },
      // Sunrise Residency: one Owner and one Maintenance Manager per block.
      {
        id: 16,
        name: 'Aarav Patel',
        email: 'aarav.sunrise.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543240',
        role: UserRole.Owner,
        propertyUnit: 'A-101',
        communityName: 'Sunrise Residency',
        createdAt: '2024-02-01',
      },
      {
        id: 17,
        name: 'Diya Shah',
        email: 'diya.sunrise.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543241',
        role: UserRole.Owner,
        propertyUnit: 'B-202',
        communityName: 'Sunrise Residency',
        createdAt: '2024-02-02',
      },
      {
        id: 18,
        name: 'Rohan Verma',
        email: 'rohan.sunrise.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543242',
        role: UserRole.Owner,
        propertyUnit: 'C-303',
        communityName: 'Sunrise Residency',
        createdAt: '2024-02-03',
      },
      {
        id: 19,
        name: 'Isha Gupta',
        email: 'isha.sunrise.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543243',
        role: UserRole.Owner,
        propertyUnit: 'D-404',
        communityName: 'Sunrise Residency',
        createdAt: '2024-02-04',
      },
      {
        id: 20,
        name: 'Sanjay Rao',
        email: 'sanjay.sunrise.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543250',
        role: UserRole.MaintenanceManager,
        communityName: 'Sunrise Residency',
        block: 'A',
        createdAt: '2024-02-01',
      },
      {
        id: 21,
        name: 'Kavita Menon',
        email: 'kavita.sunrise.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543251',
        role: UserRole.MaintenanceManager,
        communityName: 'Sunrise Residency',
        block: 'B',
        createdAt: '2024-02-02',
      },
      {
        id: 22,
        name: 'Nikhil Bansal',
        email: 'nikhil.sunrise.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543252',
        role: UserRole.MaintenanceManager,
        communityName: 'Sunrise Residency',
        block: 'C',
        createdAt: '2024-02-03',
      },
      {
        id: 23,
        name: 'Pooja Iyer',
        email: 'pooja.sunrise.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543253',
        role: UserRole.MaintenanceManager,
        communityName: 'Sunrise Residency',
        block: 'D',
        createdAt: '2024-02-04',
      },
      // Lakeview Apartments: one Owner and one Maintenance Manager per block.
      {
        id: 24,
        name: 'Aditya Nair',
        email: 'aditya.lakeview.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543260',
        role: UserRole.Owner,
        propertyUnit: 'A-101',
        communityName: 'Lakeview Apartments',
        createdAt: '2024-03-01',
      },
      {
        id: 25,
        name: 'Sneha Reddy',
        email: 'sneha.lakeview.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543261',
        role: UserRole.Owner,
        propertyUnit: 'B-202',
        communityName: 'Lakeview Apartments',
        createdAt: '2024-03-02',
      },
      {
        id: 26,
        name: 'Varun Sethi',
        email: 'varun.lakeview.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543262',
        role: UserRole.Owner,
        propertyUnit: 'C-303',
        communityName: 'Lakeview Apartments',
        createdAt: '2024-03-03',
      },
      {
        id: 27,
        name: 'Maya Krishnan',
        email: 'maya.lakeview.owner@propsync.com',
        password: 'password123',
        phone: '+91-9876543263',
        role: UserRole.Owner,
        propertyUnit: 'D-404',
        communityName: 'Lakeview Apartments',
        createdAt: '2024-03-04',
      },
      {
        id: 28,
        name: 'Rakesh Sinha',
        email: 'rakesh.lakeview.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543270',
        role: UserRole.MaintenanceManager,
        communityName: 'Lakeview Apartments',
        block: 'A',
        createdAt: '2024-03-01',
      },
      {
        id: 29,
        name: 'Anjali Das',
        email: 'anjali.lakeview.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543271',
        role: UserRole.MaintenanceManager,
        communityName: 'Lakeview Apartments',
        block: 'B',
        createdAt: '2024-03-02',
      },
      {
        id: 30,
        name: 'Dev Malhotra',
        email: 'dev.lakeview.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543272',
        role: UserRole.MaintenanceManager,
        communityName: 'Lakeview Apartments',
        block: 'C',
        createdAt: '2024-03-03',
      },
      {
        id: 31,
        name: 'Shreya Pillai',
        email: 'shreya.lakeview.manager@propsync.com',
        password: 'password123',
        phone: '+91-9876543273',
        role: UserRole.MaintenanceManager,
        communityName: 'Lakeview Apartments',
        block: 'D',
        createdAt: '2024-03-04',
      },
    ] as Array<Omit<User, 'approvalStatus'>>
  ).map((user) => ({
    ...user,
    approvalStatus: 'approved' as ApprovalStatus,
  }));

  private idCounter = 32;

  findCommunities(): string[] {
    return [...this.communities];
  }

  hasCommunity(communityName: string): boolean {
    return this.communities.some(
      (community) =>
        community.toLowerCase() === communityName.trim().toLowerCase(),
    );
  }

  normalizeCommunityName(communityName: string): string {
    return (
      this.communities.find(
        (community) =>
          community.toLowerCase() === communityName.trim().toLowerCase(),
      ) || communityName.trim()
    );
  }

  findAll(): User[] {
    return [...this.users];
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  /** Administrators that can act on signup requests for one community. */
  findApprovedAdministratorsByCommunity(communityName?: string): User[] {
    if (!communityName) return [];

    const normalized = communityName.trim().toLowerCase();
    return this.users.filter(
      (user) =>
        user.role === UserRole.Admin &&
        user.approvalStatus === 'approved' &&
        user.communityName?.trim().toLowerCase() === normalized,
    );
  }

  create(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: this.idCounter++ };
    this.users.push(newUser);
    return newUser;
  }

  remove(id: number): boolean {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
