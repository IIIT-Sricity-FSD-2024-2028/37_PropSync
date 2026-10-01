import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintsService } from '../complaints/complaints.service';
import { CreateBillDto } from './dto/bill.dto';
import { BillsRepository } from './bills.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipient, NotificationType } from '../notifications/dto/notification.dto';

export interface ServiceBill {
  id: number;
  complaintId: number;
  amount: number;
  penalty: number;
  totalAmount: number;
  description?: string;
  attachmentUrls?: string[];
  attachmentNames?: string[];
  isPaid: boolean;
  status: 'submitted' | 'paid';
  generatedAt: string;
  paidAt?: string;
}

@Injectable()
export class BillsService {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly billsRepository: BillsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(complaintId?: number): ServiceBill[] {
    const bills = this.billsRepository.findAll();
    if (complaintId) {
      return bills.filter((bill) => bill.complaintId === complaintId);
    }
    return bills;
  }

  findById(id: number): ServiceBill {
    const bill = this.billsRepository.findById(id);
    if (!bill) throw new NotFoundException(`Bill with id ${id} not found`);
    return bill;
  }

  create(dto: CreateBillDto): ServiceBill {
    const existingOpenBill = this.billsRepository
      .findAll()
      .find((bill) => bill.complaintId === dto.complaintId && !bill.isPaid);

    if (existingOpenBill) {
      throw new BadRequestException(
        `An unpaid bill already exists for complaint ${dto.complaintId}`,
      );
    }

    const penalty = dto.penalty ?? 0;
    const bill = this.billsRepository.create({
      complaintId: dto.complaintId,
      amount: dto.amount,
      penalty,
      totalAmount: dto.amount + penalty,
      description: dto.description,
      attachmentUrls: dto.attachmentUrls,
      attachmentNames: dto.attachmentNames,
      isPaid: false,
      status: 'submitted',
      generatedAt: new Date().toISOString().split('T')[0],
    });

    this.complaintsService.markCompletedAndBilled(dto.complaintId);
    const complaint = this.complaintsService.findById(dto.complaintId);
    this.notificationsService.create({
      userId: complaint.ownerId,
      complaintId: complaint.id,
      type: NotificationType.PaymentDue,
      recipient: NotificationRecipient.Owner,
      message: `A service bill of ${bill.totalAmount} is ready for complaint #${complaint.id}.`,
    });
    return bill;
  }

  markPaid(id: number): ServiceBill {
    const bill = this.findById(id);
    if (bill.isPaid) throw new BadRequestException('Bill is already paid');

    bill.isPaid = true;
    bill.status = 'paid';
    bill.paidAt = new Date().toISOString().split('T')[0];
    this.complaintsService.markPaidAndClosed(bill.complaintId);
    const complaint = this.complaintsService.findById(bill.complaintId);
    if (complaint.assignedProviderId) {
      this.notificationsService.create({
        userId: complaint.assignedProviderId,
        complaintId: complaint.id,
        type: NotificationType.PaymentDue,
        recipient: NotificationRecipient.ServiceProvider,
        message: `Payment for complaint #${complaint.id} has been processed.`,
      });
    }
    return bill;
  }

  remove(id: number): { message: string } {
    if (!this.billsRepository.remove(id)) {
      throw new NotFoundException(`Bill with id ${id} not found`);
    }
    return { message: `Bill ${id} deleted` };
  }
}
