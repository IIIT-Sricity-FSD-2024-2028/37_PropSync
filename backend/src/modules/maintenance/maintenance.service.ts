import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { CreateMaintenanceDto, SettleFeeDto, SubmitTransactionDto } from './dto/maintenance.dto';
import { MaintenanceRepository } from './maintenance.repository';

export type MaintenancePaymentStatus = 'pending' | 'payment_submitted' | 'paid';
export type FeeSettlementStatus = 'pending' | 'settled';

export interface MaintenancePayment {
  id: number;
  ownerId: number;
  managerId: number;
  month: string;
  amount: number;
  status: MaintenancePaymentStatus;
  transactionId?: string | null;
  paidAt: Date | null;
  createdAt: Date;
  platformFee: number;
  feeSettlementStatus: FeeSettlementStatus;
  feeSettledAt: Date | null;
}

export interface MaintenancePaymentView extends MaintenancePayment {
  ownerName?: string;
  ownerUnit?: string;
  ownerBlock?: string;
  managerName?: string;
  managerBlock?: string;
}

export interface PlatformRevenueBreakdownItem {
  paymentId: number;
  owner: string;
  maintenanceManager: string;
  month: string;
  amountPaid: number;
  platformRevenue: number;
  managerAmount: number;
  paidAt: Date | null;
  feeSettledAt: Date | null;
  status: string;
  feeSettlementStatus: string;
}

export interface PlatformRevenueSummary {
  totalMaintenanceCollected: number;
  platformRevenue: number;
  managerAmount: number;
  revenuePercentage: number;
  paidPaymentCount: number;
  breakdown: PlatformRevenueBreakdownItem[];
  monthlyBreakdown: Array<{
    month: string;
    totalMaintenanceCollected: number;
    platformRevenue: number;
    managerAmount: number;
    paidPaymentCount: number;
  }>;
}

@Injectable()
export class MaintenanceService {
  private readonly defaultManagerId = 5;

  constructor(
    private readonly usersService: UsersService,
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  createMonthlyCharges(dto: CreateMaintenanceDto, actingManagerId?: number): { message: string } {
    const managerId = actingManagerId || dto.managerId || this.defaultManagerId;
    const manager = this.getManager(managerId);
    const managerBlock = manager.block!;
    const managerCommunity = manager.communityName.trim().toLowerCase();
    const owners = this.usersService
      .findByRole(UserRole.Owner)
      .filter((owner) =>
        owner.communityName?.trim().toLowerCase() === managerCommunity &&
        this.getOwnerBlock(owner) === managerBlock,
      );

    if (!owners.length) {
      throw new BadRequestException(
        `No owners found for Block ${managerBlock} maintenance billing`,
      );
    }

    const payments = this.maintenanceRepository.findAll();
    const duplicate = owners.find((owner) =>
      payments.some(
        (payment) => payment.ownerId === owner.id && payment.month === dto.month,
      ),
    );

    if (duplicate) {
      throw new ConflictException(
        `Maintenance charge already exists for owner ${duplicate.id} for ${dto.month}`,
      );
    }

    const platformFee = this.roundMoney(dto.amount * 0.05);

    owners.forEach((owner) => {
      this.maintenanceRepository.create({
        ownerId: owner.id,
        managerId,
        month: dto.month,
        amount: dto.amount,
        status: 'pending',
        transactionId: null,
        paidAt: null,
        createdAt: new Date(),
        platformFee,
        feeSettlementStatus: 'pending',
        feeSettledAt: null,
      });
    });

    return {
      message: `Maintenance charges created successfully for Block ${managerBlock} owners`,
    };
  }

  findAll(managerId?: number): MaintenancePaymentView[] {
    let payments = this.maintenanceRepository.findAll();
    if (managerId) {
      payments = payments.filter((payment) => payment.managerId === managerId);
    }
    return payments
      .map((payment) => this.toView(payment));
  }

  findAllForManager(managerId: number): MaintenancePaymentView[] {
    this.getManager(managerId);
    return this.findAll(managerId);
  }

  findByOwner(ownerId: number): MaintenancePaymentView[] {
    this.assertOwnerExists(ownerId);
    return this.maintenanceRepository
      .findAll()
      .filter((payment) => payment.ownerId === ownerId)
      .map((payment) => this.toView(payment));
  }

  submitTransaction(id: number, dto: SubmitTransactionDto): MaintenancePaymentView {
    const payment = this.maintenanceRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Maintenance payment ${id} not found`);
    }
    if (payment.status === 'paid') {
      throw new ConflictException(`Maintenance payment ${id} has already been paid and confirmed`);
    }
    if (!dto.transactionId || !dto.transactionId.trim()) {
      throw new BadRequestException('Transaction ID cannot be empty');
    }

    payment.transactionId = dto.transactionId.trim();
    // Transition status to payment_submitted awaiting manager review
    payment.status = 'payment_submitted';
    payment.paidAt = null;
    return this.toView(payment);
  }

  markPaid(id: number): MaintenancePaymentView {
    const payment = this.maintenanceRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Maintenance payment ${id} not found`);
    }
    if (payment.status === 'paid') {
      throw new ConflictException(`Maintenance payment ${id} is already paid`);
    }
    if (!payment.transactionId || payment.status !== 'payment_submitted') {
      throw new BadRequestException(
        'Cannot mark payment as paid before the owner submits a valid transaction ID',
      );
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    if (!payment.feeSettlementStatus) {
      payment.feeSettlementStatus = 'pending';
    }
    return this.toView(payment);
  }

  settlePlatformFee(dto?: SettleFeeDto, actingManagerId?: number): { message: string; settledCount: number; settledAmount: number } {
    const managerId = actingManagerId || dto?.managerId;
    let payments = this.maintenanceRepository.findAll().filter((p) => p.status === 'paid' && p.feeSettlementStatus !== 'settled');

    if (dto?.paymentId) {
      payments = payments.filter((p) => p.id === dto.paymentId);
    } else if (managerId) {
      payments = payments.filter((p) => p.managerId === managerId);
    }

    if (!payments.length) {
      return {
        message: 'No pending platform fees to settle',
        settledCount: 0,
        settledAmount: 0,
      };
    }

    const now = new Date();
    let totalSettledFee = 0;
    payments.forEach((p) => {
      p.feeSettlementStatus = 'settled';
      p.feeSettledAt = now;
      totalSettledFee += (p.platformFee || this.roundMoney(p.amount * 0.05));
    });

    return {
      message: `Successfully settled platform fees for ${payments.length} payment(s)`,
      settledCount: payments.length,
      settledAmount: this.roundMoney(totalSettledFee),
    };
  }

  getOwnerSummary(ownerId: number): {
    totalPaid: number;
    pendingCount: number;
    monthlyPaid: number;
    totalAmount: number;
  } {
    const payments = this.findByOwner(ownerId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const paid = payments.filter((payment) => payment.status === 'paid');

    return {
      totalPaid: paid.reduce((sum, payment) => sum + payment.amount, 0),
      pendingCount: payments.filter((payment) => payment.status !== 'paid')
        .length,
      monthlyPaid: paid
        .filter((payment) => payment.month === currentMonth)
        .reduce((sum, payment) => sum + payment.amount, 0),
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }

  /**
   * Calculates the platform share directly from settled platform fee records.
   * Only paid payments with feeSettlementStatus === 'settled' count as revenue.
   */
  getPlatformRevenue(): PlatformRevenueSummary {
    const settledPayments = this.maintenanceRepository
      .findAll()
      .filter((payment) => payment.status === 'paid' && payment.feeSettlementStatus === 'settled');

    const breakdown = settledPayments.map((payment) => {
      const owner = this.usersService.findRawById(payment.ownerId);
      const manager = this.usersService.findRawById(payment.managerId);
      const amountPaid = this.roundMoney(payment.amount);
      const platformRevenue = payment.platformFee !== undefined
        ? this.roundMoney(payment.platformFee)
        : this.roundMoney(amountPaid * 0.05);

      return {
        paymentId: payment.id,
        owner: owner?.name || `Owner #${payment.ownerId}`,
        maintenanceManager: manager?.name || `Manager #${payment.managerId}`,
        month: payment.month,
        amountPaid,
        platformRevenue,
        managerAmount: this.roundMoney(amountPaid - platformRevenue),
        paidAt: payment.paidAt,
        feeSettledAt: payment.feeSettledAt,
        status: payment.status,
        feeSettlementStatus: payment.feeSettlementStatus,
      };
    });

    const totalMaintenanceCollected = this.roundMoney(
      breakdown.reduce((sum, payment) => sum + payment.amountPaid, 0),
    );
    const platformRevenue = this.roundMoney(
      breakdown.reduce((sum, payment) => sum + payment.platformRevenue, 0),
    );
    const monthly = new Map<string, PlatformRevenueSummary['monthlyBreakdown'][number]>();

    breakdown.forEach((payment) => {
      // Revenue is grouped by the fee settlement date (or fallback to paid date / charge month)
      const dateToGroup = payment.feeSettledAt || payment.paidAt;
      const settledDate = dateToGroup ? new Date(dateToGroup) : null;
      const key = settledDate && !Number.isNaN(settledDate.getTime())
        ? settledDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        : payment.month;
      const current = monthly.get(key) || {
        month: key,
        totalMaintenanceCollected: 0,
        platformRevenue: 0,
        managerAmount: 0,
        paidPaymentCount: 0,
      };
      current.totalMaintenanceCollected = this.roundMoney(current.totalMaintenanceCollected + payment.amountPaid);
      current.platformRevenue = this.roundMoney(current.platformRevenue + payment.platformRevenue);
      current.managerAmount = this.roundMoney(current.managerAmount + payment.managerAmount);
      current.paidPaymentCount += 1;
      monthly.set(key, current);
    });

    return {
      totalMaintenanceCollected,
      platformRevenue,
      managerAmount: this.roundMoney(totalMaintenanceCollected - platformRevenue),
      revenuePercentage: 5,
      paidPaymentCount: breakdown.length,
      breakdown,
      monthlyBreakdown: Array.from(monthly.values()),
    };
  }

  remove(id: number): { message: string } {
    if (!this.maintenanceRepository.remove(id)) {
      throw new NotFoundException(`Maintenance payment ${id} not found`);
    }

    return { message: `Maintenance payment ${id} deleted successfully` };
  }

  removeForManager(managerId: number, paymentId: number): { message: string } {
    this.getManager(managerId);
    const payment = this.maintenanceRepository.findById(paymentId);
    if (!payment || payment.managerId !== managerId) {
      throw new NotFoundException(`Maintenance payment ${paymentId} not found in your assigned block`);
    }
    if (payment.status === 'payment_submitted') {
      throw new BadRequestException('Cannot delete payment while awaiting confirmation. Please review and mark as paid.');
    }
    return this.remove(paymentId);
  }

  private assertOwnerExists(ownerId: number): void {
    const owner = this.usersService.findRawById(ownerId);
    if (!owner) {
      throw new NotFoundException(`Owner ${ownerId} not found`);
    }
    if (owner.role !== UserRole.Owner) {
      throw new BadRequestException(`User ${ownerId} is not an owner`);
    }
  }

  private getManager(managerId: number) {
    const manager = this.usersService.findRawById(managerId);
    if (!manager) {
      throw new NotFoundException(`Maintenance manager ${managerId} not found`);
    }
    if (manager.role !== UserRole.MaintenanceManager) {
      throw new BadRequestException(`User ${managerId} is not a maintenance manager`);
    }
    const block = manager.block?.trim().toUpperCase();
    if (!block) {
      throw new BadRequestException(
        `Maintenance manager ${managerId} does not have a block configured`,
      );
    }
    if (!manager.communityName) {
      throw new BadRequestException(`Maintenance manager ${managerId} does not have a community configured`);
    }
    return { ...manager, block, communityName: manager.communityName };
  }

  private getOwnerBlock(owner?: { block?: string; propertyUnit?: string }): string | undefined {
    if (!owner) return undefined;
    if (owner.block?.trim()) {
      return owner.block.trim().toUpperCase();
    }
    return this.getBlockFromUnit(owner.propertyUnit);
  }

  private getBlockFromUnit(propertyUnit?: string): string | undefined {
    return propertyUnit?.trim().charAt(0).toUpperCase();
  }

  private toView(payment: MaintenancePayment): MaintenancePaymentView {
    const owner = this.usersService.findRawById(payment.ownerId);
    const manager = this.usersService.findRawById(payment.managerId);
    const platformFee = payment.platformFee !== undefined
      ? payment.platformFee
      : this.roundMoney(payment.amount * 0.05);

    return {
      ...payment,
      platformFee,
      feeSettlementStatus: payment.feeSettlementStatus || 'pending',
      feeSettledAt: payment.feeSettledAt || null,
      ownerName: owner?.name,
      ownerUnit: owner?.propertyUnit,
      ownerBlock: this.getOwnerBlock(owner),
      managerName: manager?.name,
      managerBlock: manager?.block,
    };
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

