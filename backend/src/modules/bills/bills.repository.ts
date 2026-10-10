import { Injectable } from '@nestjs/common';
import type { ServiceBill } from './bills.service';

@Injectable()
export class BillsRepository {
  private bills: ServiceBill[] = [
    {
      id: 1,
      complaintId: 6,
      amount: 2800,
      penalty: 0,
      totalAmount: 2800,
      description: 'Electrical rewiring of faulty section',
      isPaid: true,
      status: 'paid',
      generatedAt: '2024-03-09',
      paidAt: '2024-03-09',
    },
    {
      id: 2,
      complaintId: 5,
      amount: 4200,
      penalty: 500,
      totalAmount: 4700,
      description: 'AC repair - delayed completion penalty applied',
      isPaid: false,
      status: 'submitted',
      generatedAt: '2024-03-13',
    },
    {
      id: 3,
      complaintId: 11,
      amount: 3200,
      penalty: 0,
      totalAmount: 3200,
      description: 'Clubhouse HVAC noise repair',
      isPaid: true,
      status: 'paid',
      generatedAt: '2024-03-07',
      paidAt: '2024-03-08',
    },
    {
      id: 4,
      complaintId: 10,
      amount: 1800,
      penalty: 0,
      totalAmount: 1800,
      description: 'Lobby camera repair bill awaiting payment',
      isPaid: false,
      status: 'submitted',
      generatedAt: '2024-03-13',
    },
  ];

  private idCounter = 5;

  findAll(): ServiceBill[] {
    return [...this.bills];
  }

  findById(id: number): ServiceBill | undefined {
    return this.bills.find((bill) => bill.id === id);
  }

  create(bill: Omit<ServiceBill, 'id'>): ServiceBill {
    const newBill = { ...bill, id: this.idCounter++ };
    this.bills.push(newBill);
    return newBill;
  }

  remove(id: number): boolean {
    const index = this.bills.findIndex((bill) => bill.id === id);
    if (index === -1) return false;
    this.bills.splice(index, 1);
    return true;
  }
}
