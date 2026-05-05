import { Injectable } from '@nestjs/common';
import type { Payment } from './payments.service';

@Injectable()
export class PaymentsRepository {
  private payments: Payment[] = [
    {
      id: 1,
      billId: 1,
      ownerId: 2,
      amount: 2800,
      paidAt: '2024-03-10',
    },
    {
      id: 2,
      billId: 3,
      ownerId: 1,
      amount: 3200,
      paidAt: '2024-03-08',
    },
  ];

  private idCounter = 3;

  findAll(): Payment[] {
    return [...this.payments];
  }

  findById(id: number): Payment | undefined {
    return this.payments.find((payment) => payment.id === id);
  }

  create(payment: Omit<Payment, 'id'>): Payment {
    const newPayment = { ...payment, id: this.idCounter++ };
    this.payments.push(newPayment);
    return newPayment;
  }

  remove(id: number): boolean {
    const index = this.payments.findIndex((payment) => payment.id === id);
    if (index === -1) return false;
    this.payments.splice(index, 1);
    return true;
  }
}
