import { ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRepository } from './maintenance.repository';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    service = new MaintenanceService(
      new UsersService(new UsersRepository()),
      new MaintenanceRepository(),
    );
  });

  it('creates one pending monthly charge for owners in the manager block', () => {
    const result = service.createMonthlyCharges({
      month: '2026-05',
      amount: 2000,
      managerId: 5,
    });
    const charges = service.findAll();

    expect(result).toEqual({
      message: 'Maintenance charges created successfully for Block A owners',
    });
    expect(charges).toHaveLength(1);
    expect(charges[0].ownerUnit).toBe('A-101');
    expect(charges[0].managerId).toBe(5);
    expect(charges.every((item) => item.status === 'pending')).toBe(true);
    expect(charges.every((item) => item.amount === 2000)).toBe(true);
  });

  it('prevents duplicate owner-month maintenance charges', () => {
    service.createMonthlyCharges({ month: '2026-05', amount: 2000, managerId: 5 });

    expect(() =>
      service.createMonthlyCharges({ month: '2026-05', amount: 2000, managerId: 5 }),
    ).toThrow(ConflictException);
  });

  it('marks a pending maintenance payment as paid and updates owner summary', () => {
    service.createMonthlyCharges({
      month: new Date().toISOString().slice(0, 7),
      amount: 2000,
      managerId: 5,
    });
    const [charge] = service.findAll();

    const paid = service.markPaid(charge.id);
    const summary = service.getOwnerSummary(charge.ownerId);

    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeInstanceOf(Date);
    expect(summary).toEqual({
      totalPaid: 2000,
      pendingCount: 0,
      monthlyPaid: 2000,
    });
  });

  it('keeps manager views scoped to their own block payments', () => {
    service.createMonthlyCharges({ month: '2026-05', amount: 2000, managerId: 5 });
    service.createMonthlyCharges({ month: '2026-05', amount: 3000, managerId: 6 });

    expect(service.findAll(5).map((payment) => payment.ownerUnit)).toEqual([
      'A-101',
    ]);
    expect(service.findAll(6).map((payment) => payment.ownerUnit)).toEqual([
      'B-202',
    ]);
  });
});
