import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { CreateMaintenanceDto } from './dto/maintenance.dto';
import { MaintenanceRepository } from './maintenance.repository';

export type MaintenancePaymentStatus = 'pending' | 'paid';

export interface MaintenancePayment {
  id: number;
  ownerId: number;
  managerId: number;
  month: string;
  amount: number;
  status: MaintenancePaymentStatus;
  paidAt: Date | null;
}

export interface MaintenancePaymentView extends MaintenancePayment {
  ownerName?: string;
  ownerUnit?: string;
  ownerBlock?: string;
  managerBlock?: string;
}

@Injectable()
export class MaintenanceService {
  private readonly defaultManagerId = 5;

  constructor(
    private readonly usersService: UsersService,
    private readonly maintenanceRepository: MaintenanceRepository,
  ) {}

  createMonthlyCharges(dto: CreateMaintenanceDto): { message: string } {
    const managerId = dto.managerId || this.defaultManagerId;
    const managerBlock = this.getManagerBlock(managerId);
    const owners = this.usersService
      .findByRole(UserRole.Owner)
      .filter((owner) => this.getBlockFromUnit(owner.propertyUnit) === managerBlock);

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

    owners.forEach((owner) => {
      this.maintenanceRepository.create({
        ownerId: owner.id,
        managerId,
        month: dto.month,
        amount: dto.amount,
        status: 'pending',
        paidAt: null,
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

  findByOwner(ownerId: number): MaintenancePaymentView[] {
    this.assertOwnerExists(ownerId);
    return this.maintenanceRepository
      .findAll()
      .filter((payment) => payment.ownerId === ownerId)
      .map((payment) => this.toView(payment));
  }

  markPaid(id: number): MaintenancePaymentView {
    const payment = this.maintenanceRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Maintenance payment ${id} not found`);
    }
    if (payment.status === 'paid') {
      throw new ConflictException(`Maintenance payment ${id} is already paid`);
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    return this.toView(payment);
  }

  getOwnerSummary(ownerId: number): {
    totalPaid: number;
    pendingCount: number;
    monthlyPaid: number;
  } {
    const payments = this.findByOwner(ownerId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const paid = payments.filter((payment) => payment.status === 'paid');

    return {
      totalPaid: paid.reduce((sum, payment) => sum + payment.amount, 0),
      pendingCount: payments.filter((payment) => payment.status === 'pending')
        .length,
      monthlyPaid: paid
        .filter((payment) => payment.month === currentMonth)
        .reduce((sum, payment) => sum + payment.amount, 0),
    };
  }

  remove(id: number): { message: string } {
    if (!this.maintenanceRepository.remove(id)) {
      throw new NotFoundException(`Maintenance payment ${id} not found`);
    }

    return { message: `Maintenance payment ${id} deleted successfully` };
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

  private getManagerBlock(managerId: number): string {
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
    return block;
  }

  private getBlockFromUnit(propertyUnit?: string): string | undefined {
    return propertyUnit?.trim().charAt(0).toUpperCase();
  }

  private toView(payment: MaintenancePayment): MaintenancePaymentView {
    const owner = this.usersService.findRawById(payment.ownerId);
    const manager = this.usersService.findRawById(payment.managerId);
    return {
      ...payment,
      ownerName: owner?.name,
      ownerUnit: owner?.propertyUnit,
      ownerBlock: this.getBlockFromUnit(owner?.propertyUnit),
      managerBlock: manager?.block,
    };
  }
}
