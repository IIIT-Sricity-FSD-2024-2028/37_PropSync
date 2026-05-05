import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintsService } from '../complaints/complaints.service';
import { ApproveEstimateDto, CreateEstimateDto } from './dto/estimate.dto';
import { EstimatesRepository } from './estimates.repository';

export interface ServiceEstimate {
  id: number;
  complaintId: number;
  providerId: number;
  estimatedCost: number;
  notes?: string;
  approved: boolean | null;
  managerNote?: string;
  submittedAt: string;
  reviewedAt?: string;
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

  create(dto: CreateEstimateDto): ServiceEstimate {
    const existing = this.estimatesRepository
      .findAll()
      .find(
        (estimate) =>
          estimate.complaintId === dto.complaintId &&
          estimate.providerId === dto.providerId,
      );

    if (existing) {
      throw new BadRequestException(
        `An estimate for complaint ${dto.complaintId} by provider ${dto.providerId} already exists`,
      );
    }

    this.complaintsService.markEstimateSubmitted(
      dto.complaintId,
      dto.providerId,
    );

    return this.estimatesRepository.create({
      complaintId: dto.complaintId,
      providerId: dto.providerId,
      estimatedCost: dto.estimatedCost,
      notes: dto.notes,
      approved: null,
      submittedAt: new Date().toISOString().split('T')[0],
    });
  }

  review(id: number, dto: ApproveEstimateDto): ServiceEstimate {
    const estimate = this.findById(id);
    if (estimate.approved !== null) {
      throw new BadRequestException('This estimate has already been reviewed');
    }

    estimate.approved = dto.approved;
    estimate.managerNote = dto.managerNote;
    estimate.reviewedAt = new Date().toISOString().split('T')[0];
    this.complaintsService.markEstimateReviewed(
      estimate.complaintId,
      dto.approved,
    );
    return estimate;
  }

  remove(id: number): { message: string } {
    if (!this.estimatesRepository.remove(id)) {
      throw new NotFoundException(`Estimate with id ${id} not found`);
    }
    return { message: `Estimate ${id} deleted` };
  }
}
