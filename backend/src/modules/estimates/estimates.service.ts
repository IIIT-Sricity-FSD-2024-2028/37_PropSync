import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus } from '../complaints/dto/complaint.dto';
import { ComplaintsService } from '../complaints/complaints.service';
import { ApproveEstimateDto, CreateEstimateDto } from './dto/estimate.dto';
import { EstimatesRepository } from './estimates.repository';

export interface ServiceEstimate {
  id: number;
  complaintId: number;
  providerId: number;
  estimatedCost: number;
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  approved: boolean | null;
  managerNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  updatedAt?: string;
  isEdited?: boolean;
  selectionStatus?: 'candidate' | 'selected' | 'rejected' | 'not_selected';
}

@Injectable()
export class EstimatesService {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly estimatesRepository: EstimatesRepository,
  ) {}

  findAll(complaintId?: number): ServiceEstimate[] {
    const estimates = this.estimatesRepository.findAll();
    if (complaintId) {
      return estimates.filter((estimate) => estimate.complaintId === complaintId);
    }
    return estimates;
  }

  findById(id: number): ServiceEstimate {
    const estimate = this.estimatesRepository.findById(id);
    if (!estimate) {
      throw new NotFoundException(`Estimate with id ${id} not found`);
    }
    return estimate;
  }

  findByProvider(providerId: number): ServiceEstimate[] {
    return this.estimatesRepository
      .findAll()
      .filter((estimate) => estimate.providerId === providerId);
  }

  assertAccess(estimate: ServiceEstimate, role: string, userId: number): void {
    if (['super_user', 'admin', 'maintenance_manager'].includes(role)) return;
    if (role === 'service_provider' && userId === estimate.providerId) return;
    try {
      this.complaintsService.assertEstimateReader(estimate.complaintId, role, userId);
      return;
    } catch {}
    throw new ForbiddenException('You cannot view another provider’s estimate');
  }

  findVisible(role: string, userId: number, complaintId?: number): ServiceEstimate[] {
    if (!userId) throw new ForbiddenException('A valid user session is required');
    if (complaintId && role === 'maintenance_manager') this.complaintsService.assertManager(complaintId, userId);
    return this.findAll(complaintId).filter(e => {
      try { this.assertAccess(e, role, userId); return true; }
      catch { return false; }
    });
  }

  create(dto: CreateEstimateDto): ServiceEstimate {
    const complaint = this.complaintsService.validateEstimateSubmission(dto.complaintId, dto.providerId);
    if (!Number.isFinite(dto.estimatedCost) || dto.estimatedCost <= 0 || dto.estimatedCost > 50000 || !dto.notes?.trim() || !dto.documentUrl) {
      throw new BadRequestException('A positive estimated cost (up to ₹50,000), description of work and estimate document are required');
    }
    if (this.findByProvider(dto.providerId).some(e => e.complaintId === dto.complaintId)) {
      throw new BadRequestException('An estimate for this complaint has already been submitted by this provider');
    }
    return this.complaintsService.atomic(dto.complaintId, () => {
      const estimate = this.estimatesRepository.create({
        complaintId: dto.complaintId, providerId: dto.providerId,
        estimatedCost: dto.estimatedCost, notes: dto.notes!.trim(),
        documentUrl: dto.documentUrl, documentName: dto.documentName,
        approved: null,
        selectionStatus: complaint.assignedProviderId ? undefined : 'candidate',
        submittedAt: new Date().toISOString(),
      });
      this.complaintsService.markEstimateSubmitted(dto.complaintId, dto.providerId);
      return estimate;
    });
  }

  review(id: number, dto: ApproveEstimateDto): ServiceEstimate {
    const estimate = this.findById(id);
    const complaint = this.complaintsService.findById(estimate.complaintId);
    if (estimate.approved !== null || ['not_selected', 'rejected'].includes(estimate.selectionStatus || '')) {
      throw new BadRequestException('This estimate has already received a selection outcome');
    }
    if (complaint.status === ComplaintStatus.Approved && !complaint.assignedProviderId) {
      if (dto.approved) {
        this.complaintsService.assignProvider(complaint.id, estimate.providerId, { managerNote: dto.managerNote });
      } else {
        this.complaintsService.atomic(complaint.id, () => {
          this.complaintsService.spReject(complaint.id, estimate.providerId, dto.managerNote || 'Estimate rejected by manager');
          estimate.approved = false;
          estimate.selectionStatus = 'rejected';
          estimate.managerNote = dto.managerNote;
          estimate.reviewedAt = new Date().toISOString();
          this.complaintsService.notifyEstimateRejected(complaint.id, estimate.providerId, dto.managerNote);
        });
      }
      return estimate;
    }
    if (complaint.assignedProviderId !== estimate.providerId ||
        ![ComplaintStatus.Assigned, ComplaintStatus.EstimatingCost].includes(complaint.status)) {
      throw new BadRequestException('Only the assigned provider’s pending legacy estimate can be reviewed');
    }
    return this.complaintsService.atomic(complaint.id, () => {
      this.complaintsService.markEstimateReviewed(estimate.complaintId, dto.approved);
      estimate.approved = dto.approved;
      estimate.managerNote = dto.managerNote;
      estimate.reviewedAt = new Date().toISOString();
      estimate.selectionStatus = dto.approved ? 'selected' : 'rejected';
      return estimate;
    });
  }

  update(id: number, dto: Partial<CreateEstimateDto>, role?: string, userId?: number): ServiceEstimate {
    const estimate = this.findById(id);
    if (role === 'service_provider' && userId && estimate.providerId !== userId) {
      throw new ForbiddenException('You can only update your own estimate');
    }
    if (dto.estimatedCost !== undefined) {
      const cost = Number(dto.estimatedCost);
      if (!Number.isFinite(cost) || cost <= 0 || cost > 50000) {
        throw new BadRequestException('Estimated cost must be greater than zero and cannot exceed ₹50,000');
      }
    }
    const updated = this.estimatesRepository.update(id, {
      ...(dto.estimatedCost !== undefined ? { estimatedCost: Number(dto.estimatedCost) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
      ...(dto.documentName ? { documentName: dto.documentName } : {}),
      ...(dto.documentUrl ? { documentUrl: dto.documentUrl } : {}),
      isEdited: true,
      updatedAt: new Date().toISOString(),
      approved: null,
      selectionStatus: 'candidate',
    });

    try {
      const complaint = this.complaintsService.findById(estimate.complaintId);
      if (complaint) {
        complaint.rejectedProviders = (complaint.rejectedProviders || []).filter(p => p !== estimate.providerId);
        if (!complaint.interestedProviders) complaint.interestedProviders = [];
        if (!complaint.interestedProviders.includes(estimate.providerId)) complaint.interestedProviders.push(estimate.providerId);
        complaint.estimateSubmitted = true;
        complaint.estimateApproved = false;
        if (complaint.status === ComplaintStatus.Assigned && complaint.assignedProviderId === estimate.providerId) {
          complaint.status = ComplaintStatus.EstimatingCost;
        }
      }
    } catch {}

    return updated!;
  }

  remove(id: number, role?: string, userId?: number): { message: string } {
    const estimate = this.estimatesRepository.findById(id);
    if (!estimate) return { message: `Estimate ${id} deleted` };
    if (role === 'service_provider' && userId && estimate.providerId !== userId) {
      throw new ForbiddenException('You can only delete your own estimate');
    }
    try {
      const complaint = this.complaintsService.findById(estimate.complaintId);
      if (complaint) {
        complaint.estimateSubmitted = false;
        complaint.estimateApproved = false;
        complaint.interestedProviders = (complaint.interestedProviders || []).filter(p => p !== estimate.providerId);
        complaint.rejectedProviders = (complaint.rejectedProviders || []).filter(p => p !== estimate.providerId);
        if (complaint.status === ComplaintStatus.EstimatingCost) complaint.status = ComplaintStatus.Assigned;
      }
    } catch {}
    this.estimatesRepository.remove(id);
    return { message: `Estimate ${id} deleted` };
  }
}
