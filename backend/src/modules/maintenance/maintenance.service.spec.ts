import { BadRequestException, ConflictException } from '@nestjs/common';
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
    expect(charges[0].transactionId).toBeNull();
  });

  it('allows owner to submit transaction ID and sets status to payment_submitted', () => {
    service.createMonthlyCharges({ month: '2026-10', amount: 2000, managerId: 5 });
    const [charge] = service.findAll();

    const updated = service.submitTransaction(charge.id, { transactionId: '23464263626256' });
    expect(updated.status).toBe('payment_submitted');
    expect(updated.transactionId).toBe('23464263626256');
    expect(updated.paidAt).toBeNull();
  });

  it('rejects markPaid if transaction ID has not been submitted by the owner', () => {
    service.createMonthlyCharges({ month: '2026-10', amount: 2000, managerId: 5 });
    const [charge] = service.findAll();

    expect(() => service.markPaid(charge.id)).toThrow(BadRequestException);
  });

  it('prevents duplicate owner-month maintenance charges', () => {
    service.createMonthlyCharges({ month: '2026-05', amount: 2000, managerId: 5 });

    expect(() =>
      service.createMonthlyCharges({ month: '2026-05', amount: 2000, managerId: 5 }),
    ).toThrow(ConflictException);
  });

  it('marks a submitted maintenance payment as paid and updates owner summary', () => {
    service.createMonthlyCharges({
      month: new Date().toISOString().slice(0, 7),
      amount: 2000,
      managerId: 5,
    });
    const [charge] = service.findAll();

    service.submitTransaction(charge.id, { transactionId: '23464263626256' });
    const paid = service.markPaid(charge.id);
    const summary = service.getOwnerSummary(charge.ownerId);

    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeInstanceOf(Date);
    expect(summary).toEqual({
      totalPaid: 2000,
      pendingCount: 0,
      monthlyPaid: 2000,
      totalAmount: 2000,
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

  it('calculates 5% revenue ONLY from settled platform fees, not merely paid payments', () => {
    const repository = new MaintenanceRepository();
    service = new MaintenanceService(new UsersService(new UsersRepository()), repository);

    [1, 2, 3].forEach((ownerId) => repository.create({
      ownerId,
      managerId: 5,
      month: '2026-08',
      amount: 2000,
      status: 'pending',
      transactionId: null,
      paidAt: null,
      createdAt: new Date(),
      platformFee: 100,
      feeSettlementStatus: 'pending',
      feeSettledAt: null,
    }));

    // Submit transaction and mark 2 payments as paid
    repository.findAll().slice(0, 2).forEach((payment) => {
      service.submitTransaction(payment.id, { transactionId: `TXN_${payment.id}` });
      service.markPaid(payment.id);
    });

    // Revenue should be ZERO until fees are remitted / settled
    expect(service.getPlatformRevenue()).toMatchObject({
      totalMaintenanceCollected: 0,
      platformRevenue: 0,
      managerAmount: 0,
      paidPaymentCount: 0,
    });

    // Now manager settles platform fees
    const settleResult = service.settlePlatformFee({ managerId: 5 });
    expect(settleResult.settledCount).toBe(2);
    expect(settleResult.settledAmount).toBe(200);

    // Revenue should now reflect the 2 settled payments
    const revenue = service.getPlatformRevenue();
    expect(revenue).toMatchObject({
      totalMaintenanceCollected: 4000,
      platformRevenue: 200,
      managerAmount: 3800,
      paidPaymentCount: 2,
    });

    // Mark 3rd payment paid and settle it
    service.submitTransaction(3, { transactionId: 'TXN_3' });
    service.markPaid(3);
    service.settlePlatformFee({ paymentId: 3 });
    const revenueAfter3 = service.getPlatformRevenue();
    expect(revenueAfter3).toMatchObject({
      totalMaintenanceCollected: 6000,
      platformRevenue: 300,
      managerAmount: 5700,
      paidPaymentCount: 3,
    });
  });

  it('targets only owners in the manager block and community, excluding other blocks and communities', () => {
    // Manager 5 is Block A in Green Valley Society
    service.createMonthlyCharges({ month: '2026-10', amount: 2000, managerId: 5 });
    const gvCharges = service.findAll(5);

    // Should only target Raj Kumar (id: 1, unit: A-101, Green Valley Society)
    expect(gvCharges).toHaveLength(1);
    expect(gvCharges[0].ownerId).toBe(1);
    expect(gvCharges[0].ownerUnit).toBe('A-101');

    // Should NOT target Anita Sharma (id: 2, Block B) or Aarav Patel (id: 16, Sunrise Block A)
    const allCharges = service.findAll();
    expect(allCharges.some((c) => c.ownerId === 2)).toBe(false);
    expect(allCharges.some((c) => c.ownerId === 16)).toBe(false);

    // Manager 20 is Block A in Sunrise Residency
    service.createMonthlyCharges({ month: '2026-10', amount: 2500, managerId: 20 });
    const sunriseCharges = service.findAll(20);

    // Should only target Aarav Patel (id: 16, unit: A-101, Sunrise Residency)
    expect(sunriseCharges).toHaveLength(1);
    expect(sunriseCharges[0].ownerId).toBe(16);
    expect(sunriseCharges[0].ownerUnit).toBe('A-101');
    expect(sunriseCharges[0].amount).toBe(2500);
  });
});


