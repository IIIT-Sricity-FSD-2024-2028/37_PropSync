import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus } from '../complaints/dto/complaint.dto';
import { ComplaintsService } from '../complaints/complaints.service';
import { CreateRatingDto } from './dto/rating.dto';
import { RatingsRepository } from './ratings.repository';

export interface Rating {
  id: number;
  ownerId: number;
  complaintId: number;
  score: number;
  feedback?: string;
  ratedAt: string;
}

@Injectable()
export class RatingsService {
  private readonly ratableStatuses = new Set<ComplaintStatus>([
    ComplaintStatus.Completed,
    ComplaintStatus.PaymentPending,
    ComplaintStatus.Resolved,
    ComplaintStatus.Paid,
    ComplaintStatus.Closed,
  ]);

  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly ratingsRepository: RatingsRepository,
  ) {}

  findAll(ownerId?: number, complaintId?: number): Rating[] {
    let result = this.ratingsRepository.findAll();
    if (ownerId) result = result.filter((rating) => rating.ownerId === ownerId);
    if (complaintId) {
      result = result.filter((rating) => rating.complaintId === complaintId);
    }
    return result;
  }

  findById(id: number): Rating {
    const rating = this.ratingsRepository.findById(id);
    if (!rating) throw new NotFoundException(`Rating ${id} not found`);
    return rating;
  }

  findByProvider(complaintIds: number[]): Rating[] {
    return this.ratingsRepository
      .findAll()
      .filter((rating) => complaintIds.includes(rating.complaintId));
  }

  create(dto: CreateRatingDto): Rating {
    const complaint = this.complaintsService.findById(dto.complaintId);
    if (complaint.ownerId !== dto.ownerId) {
      throw new BadRequestException(
        `Owner ${dto.ownerId} cannot rate complaint ${dto.complaintId}`,
      );
    }
    if (!complaint.assignedProviderId) {
      throw new BadRequestException(
        `Complaint ${dto.complaintId} has no assigned service provider to rate`,
      );
    }
    if (!this.ratableStatuses.has(complaint.status)) {
      throw new BadRequestException(
        `Complaint ${dto.complaintId} can be rated only after it is completed, resolved, payment pending, paid, or closed. Current status: ${complaint.status}`,
      );
    }

    const existing = this.ratingsRepository
      .findAll()
      .find(
        (rating) =>
          rating.ownerId === dto.ownerId &&
          rating.complaintId === dto.complaintId,
      );

    if (existing) {
      throw new BadRequestException(
        `Rating already submitted for complaint ${dto.complaintId} by owner ${dto.ownerId}`,
      );
    }

    return this.ratingsRepository.create({
      ownerId: dto.ownerId,
      complaintId: dto.complaintId,
      score: dto.score,
      feedback: dto.feedback,
      ratedAt: new Date().toISOString().split('T')[0],
    });
  }

  getProviderStats(complaintIds: number[]): {
    averageScore: number;
    totalRatings: number;
    ratings: Rating[];
  } {
    const relevant = this.findByProvider(complaintIds);
    const total = relevant.length;
    const avg = total
      ? relevant.reduce((sum, rating) => sum + rating.score, 0) / total
      : 0;
    return {
      averageScore: Math.round(avg * 10) / 10,
      totalRatings: total,
      ratings: relevant,
    };
  }

  remove(id: number): { message: string } {
    if (!this.ratingsRepository.remove(id)) {
      throw new NotFoundException(`Rating ${id} not found`);
    }
    return { message: `Rating ${id} deleted` };
  }
}
