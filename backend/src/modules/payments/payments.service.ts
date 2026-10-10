import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentsRepository } from './payments.repository';

export interface Payment {
  id: number;
  billId: number;
  ownerId: number;
  amount: number;
  receiptImage?: string;
  paidAt: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  findAll(ownerId?: number): Payment[] {
    const payments = this.paymentsRepository.findAll();
    if (ownerId) return payments.filter((payment) => payment.ownerId === ownerId);
    return payments;
  }

  findById(id: number): Payment {
    const payment = this.paymentsRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  findByOwner(ownerId: number): Payment[] {
    return this.paymentsRepository
      .findAll()
      .filter((payment) => payment.ownerId === ownerId);
  }

  create(dto: CreatePaymentDto): Payment {
    return this.paymentsRepository.create({
      billId: dto.billId,
      ownerId: dto.ownerId,
      amount: dto.amount,
      receiptImage: dto.receiptImage,
      paidAt: new Date().toISOString().split('T')[0],
    });
  }

  remove(id: number): { message: string } {
    if (!this.paymentsRepository.remove(id)) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return { message: `Payment ${id} deleted` };
  }
}
