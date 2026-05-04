import { Injectable } from '@nestjs/common';
import { getEstimates, setEstimates, generateId, ServiceEstimate } from '../data-store';

@Injectable()
export class EstimatesService {
  create(data: Partial<ServiceEstimate>): ServiceEstimate {
    const estimates = getEstimates();
    const newEstimate: ServiceEstimate = {
      id: generateId('E', estimates),
      complaintId: data.complaintId || '',
      providerId: data.providerId || 'Unknown',
      providerEmail: data.providerEmail || 'unknown@example.com',
      cost: data.cost || 0,
      completionTime: data.completionTime || 'Unknown',
      workDescription: data.workDescription || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setEstimates([...estimates, newEstimate]);
    return newEstimate;
  }

  findAll(): ServiceEstimate[] {
    return getEstimates();
  }

  updateStatus(id: string, status: 'approved' | 'rejected'): ServiceEstimate {
    const estimates = getEstimates();
    const estimateIndex = estimates.findIndex((e) => e.id === id);
    if (estimateIndex !== -1) {
      estimates[estimateIndex].status = status;
      setEstimates([...estimates]);
      return estimates[estimateIndex];
    }
    return null;
  }
}
