import { Injectable } from '@nestjs/common';
import type { ServiceEstimate } from './estimates.service';

@Injectable()
export class EstimatesRepository {
  private estimates: ServiceEstimate[] = [
    {
      id: 1,
      complaintId: 3,
      providerId: 12,
      estimatedCost: 1200,
      notes: 'Includes cleaning equipment and disposal charges',
      approved: null,
      submittedAt: '2024-03-10',
    },
    {
      id: 2,
      complaintId: 6,
      providerId: 10,
      estimatedCost: 2800,
      notes: 'Rewiring of faulty section + safety inspection',
      approved: true,
      reviewedAt: '2024-03-08',
      submittedAt: '2024-03-07',
    },
    {
      id: 3,
      complaintId: 5,
      providerId: 11,
      estimatedCost: 4200,
      notes: 'AC gas refill, coil cleaning, and compressor inspection',
      approved: true,
      reviewedAt: '2024-03-11',
      submittedAt: '2024-03-10',
    },
    {
      id: 4,
      complaintId: 9,
      providerId: 9,
      estimatedCost: 3600,
      notes: 'Emergency pipe replacement and basement cleanup',
      approved: true,
      reviewedAt: '2024-03-12',
      submittedAt: '2024-03-11',
    },
    {
      id: 5,
      complaintId: 10,
      providerId: 10,
      estimatedCost: 1800,
      notes: 'Camera power supply replacement and DVR test',
      approved: true,
      reviewedAt: '2024-03-12',
      submittedAt: '2024-03-12',
    },
    {
      id: 6,
      complaintId: 11,
      providerId: 11,
      estimatedCost: 3200,
      notes: 'Fan motor alignment and belt replacement',
      approved: true,
      reviewedAt: '2024-03-05',
      submittedAt: '2024-03-04',
    },
    {
      id: 7,
      complaintId: 12,
      providerId: 12,
      estimatedCost: 900,
      notes: 'Garden waste collection and disposal',
      approved: true,
      reviewedAt: '2024-03-04',
      submittedAt: '2024-03-03',
    },
  ];

  private idCounter = 8;

  findAll(): ServiceEstimate[] {
    return [...this.estimates];
  }

  findById(id: number): ServiceEstimate | undefined {
    return this.estimates.find((estimate) => estimate.id === id);
  }

  create(estimate: Omit<ServiceEstimate, 'id'>): ServiceEstimate {
    const newEstimate = { ...estimate, id: this.idCounter++ };
    this.estimates.push(newEstimate);
    return newEstimate;
  }

  remove(id: number): boolean {
    const index = this.estimates.findIndex((estimate) => estimate.id === id);
    if (index === -1) return false;
    this.estimates.splice(index, 1);
    return true;
  }
}
