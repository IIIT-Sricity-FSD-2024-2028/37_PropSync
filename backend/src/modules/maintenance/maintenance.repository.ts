import { Injectable } from '@nestjs/common';
import type { MaintenancePayment } from './maintenance.service';

@Injectable()
export class MaintenanceRepository {
  private payments: MaintenancePayment[] = [];
  private idCounter = 1;

  findAll(): MaintenancePayment[] {
    return [...this.payments];
  }

  findById(id: number): MaintenancePayment | undefined {
    return this.payments.find((payment) => payment.id === id);
  }

  create(payment: Omit<MaintenancePayment, 'id'>): MaintenancePayment {
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
