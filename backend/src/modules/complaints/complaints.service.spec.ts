import { BadRequestException } from '@nestjs/common';
import { ComplaintStatus } from './dto/complaint.dto';
import { ComplaintsService } from './complaints.service';
import { ComplaintsRepository } from './complaints.repository';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  beforeEach(() => {
    service = new ComplaintsService(
      new ComplaintsRepository(),
      new UsersService(new UsersRepository()),
    );
  });

  it('requires a deadline before a manager approves a pending complaint', () => {
    expect(() =>
      service.updateStatus(
        1,
        { status: ComplaintStatus.Approved },
        'maintenance_manager',
      ),
    ).toThrow(BadRequestException);
  });

  it('stores the deadline when approving a pending complaint', () => {
    const complaint = service.updateStatus(
      1,
      { status: ComplaintStatus.Approved, deadline: '2026-05-10' },
      'maintenance_manager',
    );

    expect(complaint.status).toBe(ComplaintStatus.Approved);
    expect(complaint.deadline).toBe('2026-05-10');
  });

  describe('Service Provider Interest & State Persistence', () => {
    it('allows a service provider to express interest without duplicates when called multiple times', () => {
      // Complaint 8 is approved and has interestedProviders: [9]
      const res1 = service.spExpressInterest(8, 10);
      expect(res1.queue).toContain(9);
      expect(res1.queue).toContain(10);

      // Provider 10 expressing interest again should be idempotent
      const res2 = service.spExpressInterest(8, 10);
      expect(res2.queue.filter((id) => id === 10).length).toBe(1);
    });

    it('persists rejection for a provider', () => {
      // Complaint 2 is approved and available
      service.spReject(2, 9, 'Not suitable');
      const complaint = service.findById(2);
      expect(complaint.rejectedProviders).toContain(9);
    });

    it('tracks interest for Provider A and Provider B independently while keeping complaint approved', () => {
      // Create a new approved complaint
      service.updateStatus(
        1,
        { status: ComplaintStatus.Approved, deadline: '2026-06-01' },
        'maintenance_manager',
      );

      // Provider 9 accepts complaint 1
      service.spExpressInterest(1, 9);
      let complaint = service.findById(1);
      expect(complaint.interestedProviders).toContain(9);
      expect(complaint.status).toBe(ComplaintStatus.Approved);

      // Provider 10 has not expressed interest yet
      expect(complaint.interestedProviders.includes(10)).toBe(false);

      // When provider 10 also accepts
      service.spExpressInterest(1, 10);
      complaint = service.findById(1);
      expect(complaint.interestedProviders).toContain(9);
      expect(complaint.interestedProviders).toContain(10);

      // Manager's queue contains both 9 and 10
      const queue = service.getInterestedProviders(1);
      expect(queue.queue).toEqual([9, 10]);
    });
  });
});
