import { Injectable } from '@nestjs/common';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from './dto/complaint.dto';
import type { Complaint } from './complaints.service';

@Injectable()
export class ComplaintsRepository {
  private complaints: Complaint[] = [
    {
      id: 1,
      title: 'Water Leakage in Block A',
      description:
        'Continuous water leakage in corridor room 203 causing wet floors and damage.',
      category: ComplaintCategory.Plumbing,
      priority: ComplaintPriority.High,
      status: ComplaintStatus.Pending,
      ownerId: 1,
      managerId: 5,
      location: 'Building A, Corridor 203',
      submittedAt: '2024-03-08',
      updatedAt: '2024-03-08',
      interestedProviders: [],
    },
    {
      id: 2,
      title: 'Street Light Not Working',
      description:
        'Street light near the main gate has not been working for the past three days.',
      category: ComplaintCategory.Electrical,
      priority: ComplaintPriority.Medium,
      status: ComplaintStatus.Approved,
      ownerId: 2,
      managerId: 6,
      location: 'Main Gate Area',
      deadline: '2024-03-15',
      submittedAt: '2024-03-07',
      updatedAt: '2024-03-09',
      interestedProviders: [10],
    },
    {
      id: 3,
      title: 'Garbage Not Collected - Block C',
      description:
        'Garbage bins in Block C are overflowing and need immediate collection.',
      category: ComplaintCategory.Sanitation,
      priority: ComplaintPriority.Medium,
      status: ComplaintStatus.EstimatingCost,
      ownerId: 3,
      managerId: 7,
      location: 'Block C',
      assignedProviderId: 12,
      estimateSubmitted: true,
      estimateApproved: false,
      deadline: '2024-03-18',
      submittedAt: '2024-03-06',
      updatedAt: '2024-03-10',
      interestedProviders: [12],
    },
    {
      id: 4,
      title: 'Lift Not Working',
      description:
        'Lift is not working since two days, causing trouble for senior residents.',
      category: ComplaintCategory.Elevator,
      priority: ComplaintPriority.High,
      status: ComplaintStatus.Assigned,
      ownerId: 2,
      managerId: 6,
      location: 'Main Building',
      assignedProviderId: 10,
      deadline: '2024-03-12',
      submittedAt: '2024-03-05',
      updatedAt: '2024-03-11',
      interestedProviders: [10],
    },
    {
      id: 5,
      title: 'AC Not Cooling - Tower B, Apt 305',
      description:
        'Air conditioning unit has stopped cooling. Residents are facing discomfort.',
      category: ComplaintCategory.HVAC,
      priority: ComplaintPriority.High,
      status: ComplaintStatus.Billed,
      ownerId: 1,
      managerId: 5,
      location: 'Tower B, Apt 305',
      assignedProviderId: 11,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-14',
      submittedAt: '2024-03-04',
      updatedAt: '2024-03-12',
      interestedProviders: [11],
    },
    {
      id: 6,
      title: 'Electrical Wiring Issue - Tower B',
      description: 'Sparks from electrical wiring in common area corridor.',
      category: ComplaintCategory.Electrical,
      priority: ComplaintPriority.High,
      status: ComplaintStatus.Closed,
      ownerId: 2,
      managerId: 6,
      location: 'Tower B, Corridor',
      assignedProviderId: 10,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-10',
      submittedAt: '2024-03-02',
      updatedAt: '2024-03-09',
      interestedProviders: [10],
    },
    {
      id: 7,
      title: 'Paint Work Needed - Tower C',
      description:
        'Peeling paint on walls of Tower C common area needs repainting.',
      category: ComplaintCategory.Painting,
      priority: ComplaintPriority.Low,
      status: ComplaintStatus.Rejected,
      ownerId: 1,
      managerId: 5,
      location: 'Tower C, Common Area',
      rejectionReason: 'Scheduled for next quarter maintenance cycle',
      submittedAt: '2024-03-01',
      updatedAt: '2024-03-03',
      interestedProviders: [],
    },
    {
      id: 8,
      title: 'Door Lock Broken - Apt 401',
      description: 'Main door lock is broken and cannot secure the apartment.',
      category: ComplaintCategory.Carpentry,
      priority: ComplaintPriority.Medium,
      status: ComplaintStatus.Approved,
      ownerId: 4,
      managerId: 8,
      location: 'Tower A, Apt 401',
      deadline: '2024-03-20',
      submittedAt: '2024-03-09',
      updatedAt: '2024-03-11',
      interestedProviders: [9],
    },
    {
      id: 9,
      title: 'Basement Pipe Burst',
      description:
        'A pipe has burst in the basement parking area and water is pooling near electrical panels.',
      category: ComplaintCategory.Plumbing,
      priority: ComplaintPriority.High,
      status: ComplaintStatus.InProgress,
      ownerId: 3,
      managerId: 7,
      location: 'Basement Parking B2',
      assignedProviderId: 9,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-16',
      submittedAt: '2024-03-10',
      updatedAt: '2024-03-12',
      interestedProviders: [9],
    },
    {
      id: 10,
      title: 'Lobby Camera Offline',
      description:
        'Security camera in Tower D lobby is offline and needs inspection.',
      category: ComplaintCategory.Security,
      priority: ComplaintPriority.Medium,
      status: ComplaintStatus.Billed,
      ownerId: 4,
      managerId: 8,
      location: 'Tower D Lobby',
      assignedProviderId: 10,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-17',
      submittedAt: '2024-03-11',
      updatedAt: '2024-03-13',
      interestedProviders: [10],
    },
    {
      id: 11,
      title: 'Clubhouse HVAC Noise',
      description:
        'The clubhouse HVAC unit is making loud noise during evening hours.',
      category: ComplaintCategory.HVAC,
      priority: ComplaintPriority.Medium,
      status: ComplaintStatus.Paid,
      ownerId: 1,
      managerId: 5,
      location: 'Clubhouse',
      assignedProviderId: 11,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-11',
      submittedAt: '2024-03-01',
      updatedAt: '2024-03-08',
      interestedProviders: [11],
    },
    {
      id: 12,
      title: 'Garden Waste Cleanup',
      description:
        'Garden waste has accumulated behind Tower C after trimming work.',
      category: ComplaintCategory.Sanitation,
      priority: ComplaintPriority.Low,
      status: ComplaintStatus.Resolved,
      ownerId: 3,
      managerId: 7,
      location: 'Tower C Garden',
      assignedProviderId: 12,
      estimateSubmitted: true,
      estimateApproved: true,
      deadline: '2024-03-09',
      submittedAt: '2024-03-01',
      updatedAt: '2024-03-07',
      interestedProviders: [12],
    },
  ];

  private idCounter = 13;

  findAll(): Complaint[] {
    return [...this.complaints];
  }

  findById(id: number): Complaint | undefined {
    return this.complaints.find((complaint) => complaint.id === id);
  }

  create(complaint: Omit<Complaint, 'id'>): Complaint {
    const newComplaint = { ...complaint, id: this.idCounter++ };
    this.complaints.push(newComplaint);
    return newComplaint;
  }

  remove(id: number): boolean {
    const index = this.complaints.findIndex((complaint) => complaint.id === id);
    if (index === -1) return false;
    this.complaints.splice(index, 1);
    return true;
  }
}
