import { Injectable } from '@nestjs/common';
import { getBills, setBills, generateId, ServiceBill } from '../data-store';

@Injectable()
export class BillsService {
  create(data: Partial<ServiceBill>): ServiceBill {
    const bills = getBills();
    const newBill: ServiceBill = {
      id: generateId('B', bills),
      complaintId: data.complaintId || '',
      providerEmail: data.providerEmail || '',
      amount: data.amount || 0,
      description: data.description || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setBills([...bills, newBill]);
    return newBill;
  }

  findAll(): ServiceBill[] {
    return getBills();
  }

  updateStatus(id: string, status: 'approved' | 'paid' | 'rejected'): ServiceBill | null {
    const bills = getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index].status = status;
      if (status === 'paid') {
        bills[index].paidAt = new Date().toISOString();
      } else if (status === 'approved') {
        bills[index].approvedAt = new Date().toISOString();
      }
      setBills([...bills]);
      return bills[index];
    }
    return null;
  }
}
