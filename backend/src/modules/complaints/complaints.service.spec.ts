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
});
