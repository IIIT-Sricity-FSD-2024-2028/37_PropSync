import { Injectable } from '@nestjs/common';
import type { ApprovalStatus, User } from './users.service';
import { UserRole } from './dto/user.dto';

@Injectable()
export class UsersRepository {
  private users: User[] = ([
    {
      id: 1,
      name: 'Raj Kumar',
      email: 'raj.owner@propsync.com',
      password: 'password123',
      phone: '+91-9876543210',
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
      name: 'Admin User',
      email: 'admin.primary@propsync.com',
      password: 'admin123',
      role: UserRole.Admin,
      createdAt: '2024-01-01',
    },
  ] as Array<Omit<User, 'approvalStatus'>>).map((user) => ({
    ...user,
    approvalStatus: 'approved' as ApprovalStatus,
  }));

  private idCounter = 14;

  findAll(): User[] {
    return [...this.users];
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
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
