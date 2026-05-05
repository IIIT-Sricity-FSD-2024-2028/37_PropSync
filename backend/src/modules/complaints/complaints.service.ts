import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';
import { ComplaintsRepository } from './complaints.repository';
import { UsersService, type User } from '../users/users.service';
import { UserRole } from '../users/dto/user.dto';

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  ownerId: number;
  managerId: number;
  location?: string;
  photo?: string;
  rejectionReason?: string;
  assignedProviderId?: number;
  deadline?: string;
  spAccepted?: boolean;
  estimateSubmitted?: boolean;
  estimateApproved?: boolean;
  submittedAt: string;
  updatedAt: string;
  interestedProviders: number[];
}

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly usersService: UsersService,
  ) {}

  findAll(
    status?: ComplaintStatus,
    ownerId?: number,
    managerId?: number,
  ): Complaint[] {
    let result = this.complaintsRepository.findAll();
    if (status) result = result.filter((c) => c.status === status);
    if (ownerId) result = result.filter((c) => c.ownerId === ownerId);
    if (managerId) result = result.filter((c) => c.managerId === managerId);
    return result;
  }

  findById(id: number): Complaint {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException(`Complaint with id ${id} not found`);
    }
    return complaint;
  }

  findByOwner(ownerId: number): Complaint[] {
    return this.complaintsRepository
      .findAll()
      .filter((complaint) => complaint.ownerId === ownerId);
  }

  findByManager(managerId: number): Complaint[] {
    return this.complaintsRepository
      .findAll()
      .filter((complaint) => complaint.managerId === managerId);
  }

  findByProvider(providerId: number): Complaint[] {
    return this.complaintsRepository
      .findAll()
      .filter((complaint) => complaint.assignedProviderId === providerId);
  }

  findPending(): Complaint[] {
    return this.complaintsRepository
      .findAll()
      .filter((complaint) => complaint.status === ComplaintStatus.Pending);
  }

  create(dto: CreateComplaintDto): Complaint {
    const today = new Date().toISOString().split('T')[0];
    const owner = this.getOwnerForComplaint(dto.ownerId);
    const managerId = dto.managerId || this.resolveManagerIdForOwner(owner);
    const location = owner.propertyUnit;

    return this.complaintsRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      status: ComplaintStatus.Pending,
      ownerId: dto.ownerId,
      managerId,
      location,
      photo: dto.photo,
      submittedAt: today,
      updatedAt: today,
      interestedProviders: [],
    });
  }

  private getOwnerForComplaint(ownerId: number) {
    const owner = this.usersService.findRawById(ownerId);
    if (!owner || owner.role !== UserRole.Owner) {
      throw new BadRequestException(`Owner ${ownerId} not found`);
    }
    if (!owner.propertyUnit?.trim()) {
      throw new BadRequestException(
        `Owner ${ownerId} does not have a propertyUnit configured`,
      );
    }
    return owner;
  }

  private resolveManagerIdForOwner(owner: User): number {
    const ownerBlock = this.getBlockFromUnit(owner.propertyUnit);
    if (!ownerBlock) {
      throw new BadRequestException(
        `Owner ${owner.id} does not have a valid block in propertyUnit`,
      );
    }

    const manager = this.usersService
      .findByRole(UserRole.MaintenanceManager)
      .find((user) => user.block?.toUpperCase() === ownerBlock);

    if (!manager) {
      throw new BadRequestException(
        `No maintenance manager configured for Block ${ownerBlock}`,
      );
    }

    return manager.id;
  }

  private getBlockFromUnit(propertyUnit?: string): string | undefined {
    return propertyUnit?.trim().charAt(0).toUpperCase();
  }

  updateStatus(
    id: number,
    dto: UpdateComplaintStatusDto,
    role?: string,
  ): Complaint {
    const complaint = this.findById(id);

    const spAllowed: Record<string, ComplaintStatus[]> = {
      [ComplaintStatus.Assigned]: [ComplaintStatus.EstimatingCost],
      [ComplaintStatus.EstimatingCost]: [ComplaintStatus.InProgress],
    };

    if (role === 'service_provider') {
      const allowed = spAllowed[complaint.status] || [];
      if (!allowed.includes(dto.status)) {
        const message =
          dto.status === ComplaintStatus.Completed
            ? 'Service provider must submit a service bill to complete the task'
            : `Service provider cannot transition "${complaint.status}" to "${dto.status}"`;
        throw new BadRequestException(message);
      }
      if (
        dto.status === ComplaintStatus.InProgress &&
        !complaint.estimateApproved
      ) {
        throw new BadRequestException(
          'Manager must approve the service estimate before work status can be updated',
        );
      }
    } else {
      const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
        [ComplaintStatus.Pending]: [
          ComplaintStatus.Approved,
          ComplaintStatus.Rejected,
        ],
        [ComplaintStatus.Approved]: [
          ComplaintStatus.Assigned,
          ComplaintStatus.Rejected,
        ],
        [ComplaintStatus.Rejected]: [],
        [ComplaintStatus.Assigned]: [ComplaintStatus.EstimatingCost],
        [ComplaintStatus.EstimatingCost]: [ComplaintStatus.InProgress],
        [ComplaintStatus.InProgress]: [ComplaintStatus.Completed],
        [ComplaintStatus.Completed]: [ComplaintStatus.Billed],
        [ComplaintStatus.Billed]: [ComplaintStatus.Paid],
        [ComplaintStatus.Paid]: [ComplaintStatus.Closed],
        [ComplaintStatus.Closed]: [],
        [ComplaintStatus.PaymentPending]: [ComplaintStatus.Resolved],
        [ComplaintStatus.Resolved]: [],
      };

      if (!validTransitions[complaint.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from "${complaint.status}" to "${dto.status}". Valid next statuses: ${validTransitions[complaint.status].join(', ') || 'none'}`,
        );
      }

      if (
        complaint.status === ComplaintStatus.Pending &&
        dto.status === ComplaintStatus.Approved
      ) {
        const deadline = dto.deadline?.trim();
        if (!deadline) {
          throw new BadRequestException(
            'Deadline is required before approving a complaint',
          );
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
          throw new BadRequestException(
            'Deadline must be provided in YYYY-MM-DD format',
          );
        }
      }
    }

    complaint.status = dto.status;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    if (dto.rejectionReason) complaint.rejectionReason = dto.rejectionReason;
    if (dto.deadline) complaint.deadline = dto.deadline;

    return complaint;
  }

  assignProvider(id: number, providerId: number): Complaint {
    const complaint = this.findById(id);
    if (complaint.status !== ComplaintStatus.Approved) {
      throw new BadRequestException(
        'Complaint must be Approved before assigning a provider',
      );
    }

    if (!complaint.interestedProviders) complaint.interestedProviders = [];
    if (complaint.interestedProviders.length === 0) {
      throw new BadRequestException(
        'No providers are in the interest queue for this complaint yet',
      );
    }
    if (!complaint.interestedProviders.includes(providerId)) {
      throw new BadRequestException(
        `Provider ${providerId} is not in the interest queue for this complaint. Queue contains: [${complaint.interestedProviders.join(', ')}]`,
      );
    }

    complaint.assignedProviderId = providerId;
    complaint.status = ComplaintStatus.Assigned;
    complaint.spAccepted = true;
    complaint.interestedProviders = [providerId];
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  remove(id: number): { message: string } {
    if (!this.complaintsRepository.remove(id)) {
      throw new NotFoundException(`Complaint with id ${id} not found`);
    }
    return { message: `Complaint ${id} deleted successfully` };
  }

  spExpressInterest(
    complaintId: number,
    providerId: number,
  ): { message: string; queue: number[] } {
    const complaint = this.findById(complaintId);

    if (complaint.status !== ComplaintStatus.Approved) {
      throw new BadRequestException(
        `Only approved complaints are open for provider interest. Current status: "${complaint.status}"`,
      );
    }

    if (!complaint.interestedProviders) complaint.interestedProviders = [];
    if (complaint.interestedProviders.includes(providerId)) {
      throw new BadRequestException(
        `Provider ${providerId} has already expressed interest in complaint ${complaintId}`,
      );
    }

    complaint.interestedProviders.push(providerId);
    complaint.updatedAt = new Date().toISOString().split('T')[0];

    return {
      message: `Provider ${providerId} added to queue for complaint ${complaintId}`,
      queue: [...complaint.interestedProviders],
    };
  }

  getInterestedProviders(complaintId: number): {
    complaintId: number;
    queue: number[];
  } {
    const complaint = this.findById(complaintId);
    return { complaintId, queue: complaint.interestedProviders || [] };
  }

  spAcceptAssignment(id: number, providerId?: number): Complaint {
    if (!providerId) throw new BadRequestException('providerId is required');
    this.spExpressInterest(id, providerId);
    return this.findById(id);
  }

  spRejectAssignment(id: number, reason: string): Complaint {
    const complaint = this.findById(id);
    if (complaint.status !== ComplaintStatus.Assigned) {
      throw new BadRequestException(
        'Complaint must be in Assigned status to reject',
      );
    }
    complaint.assignedProviderId = undefined;
    complaint.status = ComplaintStatus.Approved;
    complaint.rejectionReason = reason;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  markEstimateSubmitted(id: number, providerId: number): Complaint {
    const complaint = this.findById(id);
    if (complaint.assignedProviderId !== providerId) {
      throw new BadRequestException(
        'Estimate can only be submitted by the assigned provider',
      );
    }
    if (
      complaint.status !== ComplaintStatus.Assigned &&
      complaint.status !== ComplaintStatus.EstimatingCost
    ) {
      throw new BadRequestException(
        `Cannot submit an estimate while complaint is in "${complaint.status}" status`,
      );
    }

    complaint.estimateSubmitted = true;
    complaint.estimateApproved = false;
    complaint.status = ComplaintStatus.EstimatingCost;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  markEstimateReviewed(id: number, approved: boolean): Complaint {
    const complaint = this.findById(id);
    if (!complaint.estimateSubmitted) {
      throw new BadRequestException(
        'No submitted estimate exists for this complaint',
      );
    }

    complaint.estimateApproved = approved;
    if (approved) {
      complaint.status = ComplaintStatus.InProgress;
    } else if (complaint.status === ComplaintStatus.EstimatingCost) {
      complaint.status = ComplaintStatus.Assigned;
    }
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  markCompletedAndBilled(id: number): Complaint {
    const complaint = this.findById(id);
    if (complaint.status !== ComplaintStatus.InProgress) {
      throw new BadRequestException(
        `Complaint must be in "${ComplaintStatus.InProgress}" status before billing`,
      );
    }
    if (!complaint.estimateApproved) {
      throw new BadRequestException('Estimate must be approved before billing');
    }

    complaint.status = ComplaintStatus.Billed;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  markPaidAndClosed(id: number): Complaint {
    const complaint = this.findById(id);
    if (
      complaint.status !== ComplaintStatus.Billed &&
      complaint.status !== ComplaintStatus.Completed
    ) {
      throw new BadRequestException(
        'Complaint must be billed before payment can be marked paid',
      );
    }

    complaint.status = ComplaintStatus.Closed;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    return complaint;
  }

  getDashboardStats() {
    const complaints = this.complaintsRepository.findAll();
    const total = complaints.length;
    const pending = complaints.filter(
      (c) => c.status === ComplaintStatus.Pending,
    ).length;
    const inProgress = complaints.filter(
      (c) =>
        c.status === ComplaintStatus.InProgress ||
        c.status === ComplaintStatus.Assigned ||
        c.status === ComplaintStatus.Billed,
    ).length;
    const resolved = complaints.filter(
      (c) =>
        c.status === ComplaintStatus.Resolved ||
        c.status === ComplaintStatus.Completed ||
        c.status === ComplaintStatus.Paid ||
        c.status === ComplaintStatus.Closed,
    ).length;
    const rejected = complaints.filter(
      (c) => c.status === ComplaintStatus.Rejected,
    ).length;

    return { total, pending, inProgress, resolved, rejected };
  }
}
