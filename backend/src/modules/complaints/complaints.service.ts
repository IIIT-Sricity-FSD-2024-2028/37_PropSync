import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  AssignProviderDto,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';
import { EstimatesRepository } from '../estimates/estimates.repository';
import { ComplaintsRepository } from './complaints.repository';
import { UsersService, type User } from '../users/users.service';
import { UserRole } from '../users/dto/user.dto';
import {
  NotificationsService,
} from '../notifications/notifications.service';
import {
  NotificationRecipient,
  NotificationType,
} from '../notifications/dto/notification.dto';

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
  rejectedProviders?: number[];
}

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly usersService: UsersService,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly estimatesRepository?: EstimatesRepository,
  ) {}

  findAll(
    status?: ComplaintStatus,
    ownerId?: number,
    managerId?: number,
    availableForProviderId?: number,
    actor?: { role?: string; id?: number },
  ): Complaint[] {
    let result = this.complaintsRepository.findAll();
    if (actor?.role === 'admin' && actor?.id) {
      const admin = this.usersService.findRawById(actor.id);
      if (admin && admin.communityName) {
        const adminComm = admin.communityName.trim().toLowerCase();
        result = result.filter((c) => {
          const owner = this.usersService.findRawById(c.ownerId);
          return owner && owner.communityName?.trim().toLowerCase() === adminComm;
        });
      }
    }
    if (status) result = result.filter((c) => c.status === status);
    if (ownerId) result = result.filter((c) => c.ownerId === ownerId);
    if (managerId) result = result.filter((c) => c.managerId === managerId);
    if (availableForProviderId) {
      result = result.filter(
        (c) =>
          c.status === ComplaintStatus.Approved &&
          !c.assignedProviderId &&
          !(c.interestedProviders || []).includes(availableForProviderId) &&
          !(c.rejectedProviders || []).includes(availableForProviderId),
      );
    }
    return result;
  }

  findById(id: number, actor?: { role?: string; id?: number }): Complaint {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException(`Complaint with id ${id} not found`);
    }
    if (actor?.role === 'admin' && actor?.id) {
      const admin = this.usersService.findRawById(actor.id);
      if (admin && admin.communityName) {
        const adminComm = admin.communityName.trim().toLowerCase();
        const owner = this.usersService.findRawById(complaint.ownerId);
        if (!owner || owner.communityName?.trim().toLowerCase() !== adminComm) {
          throw new NotFoundException(`Complaint with id ${id} not found`);
        }
      }
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

  create(dto: CreateComplaintDto, actor?: { role?: string; id?: number }): Complaint {
    const today = new Date().toISOString().split('T')[0];
    const owner = this.getOwnerForComplaint(dto.ownerId);
    if (!actor?.id || !['admin', 'owner'].includes(actor.role || '')) {
      throw new BadRequestException('A valid administrator or owner session is required');
    }
    if (owner.approvalStatus !== 'approved') {
      throw new BadRequestException(`Owner ${dto.ownerId} is not an approved account`);
    }
    if (actor?.role === 'admin') {
      const administrator = actor.id ? this.usersService.findRawById(actor.id) : undefined;
      if (!administrator || administrator.role !== UserRole.Admin || administrator.approvalStatus !== 'approved') {
        throw new BadRequestException('An approved administrator account is required');
      }
      if (!administrator.communityName || administrator.communityName.trim().toLowerCase() !== owner.communityName?.trim().toLowerCase()) {
        throw new BadRequestException('You can only create complaints for owners in your community');
      }
    } else if (actor?.role === 'owner' && actor.id !== owner.id) {
      throw new BadRequestException('Owners can only submit complaints for their own account');
    }
    const managerId = dto.managerId || this.resolveManagerIdForOwner(owner);
    const location = owner.propertyUnit;

    const normalizedTitle = dto.title.trim().toLowerCase();
    const duplicate = this.complaintsRepository
      .findAll()
      .find(
        (c) =>
          c.ownerId === dto.ownerId &&
          c.title.trim().toLowerCase() === normalizedTitle &&
          c.status !== ComplaintStatus.Rejected &&
          c.status !== ComplaintStatus.Closed,
      );
    if (duplicate) {
      throw new BadRequestException(
        `A complaint with the title "${dto.title}" already exists for this owner`,
      );
    }

    const complaint = this.complaintsRepository.create({
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
      rejectedProviders: [],
    });
    this.notify(
      managerId,
      complaint.id,
      NotificationType.ComplaintSubmitted,
      NotificationRecipient.MaintenanceManager,
      `New complaint #${complaint.id}, "${complaint.title}", requires your review.`,
    );
    return complaint;
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
    actorId?: number,
  ): Complaint {
    const complaint = this.findById(id);

    const spAllowed: Record<string, ComplaintStatus[]> = {
      [ComplaintStatus.Assigned]: [ComplaintStatus.EstimatingCost],
      [ComplaintStatus.EstimatingCost]: [ComplaintStatus.InProgress],
    };

    if (role === 'service_provider') {
      if (!actorId || complaint.assignedProviderId !== actorId) {
        throw new ForbiddenException('Only the assigned provider can update work status');
      }
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

    if (dto.status === ComplaintStatus.Assigned ||
        (dto.status === ComplaintStatus.InProgress && !complaint.estimateApproved)) {
      throw new BadRequestException('Select a provider and approve their estimate before starting work');
    }
    complaint.status = dto.status;
    complaint.updatedAt = new Date().toISOString().split('T')[0];
    if (dto.rejectionReason) complaint.rejectionReason = dto.rejectionReason;
    if (dto.deadline) complaint.deadline = dto.deadline;

    if (role === 'service_provider') {
      this.notify(
        complaint.managerId,
        complaint.id,
        NotificationType.WorkCompleted,
        NotificationRecipient.MaintenanceManager,
        `Service provider updated complaint #${complaint.id} to ${dto.status}.`,
      );
      this.notify(
        complaint.ownerId,
        complaint.id,
        NotificationType.WorkCompleted,
        NotificationRecipient.Owner,
        `Your complaint #${complaint.id} is now ${dto.status}.`,
      );
    } else if (
      dto.status === ComplaintStatus.Approved ||
      dto.status === ComplaintStatus.Rejected
    ) {
      this.notify(
        complaint.ownerId,
        complaint.id,
        dto.status === ComplaintStatus.Approved
          ? NotificationType.ComplaintApproved
          : NotificationType.ComplaintRejected,
        NotificationRecipient.Owner,
        `Your complaint #${complaint.id} has been ${dto.status}${dto.rejectionReason ? `: ${dto.rejectionReason}` : '.'}`,
      );
    }

    return complaint;
  }

  // Transaction boundary for the existing synchronous in-memory persistence.
  // A database-backed repository must replace this with a database transaction.
  atomic<T>(id: number, operation: () => T): T {
    const complaint = this.findById(id);
    const snapshot = structuredClone(complaint);
    const estimates = this.estimatesRepository?.findAll().filter(e => e.complaintId === id) || [];
    const previous = estimates.map(e => structuredClone(e));
    const notificationIds = new Set(this.notificationsService?.findAll().map(n => n.id));
    try { return operation(); }
    catch (error) {
      for (const key of Object.keys(complaint)) delete complaint[key];
      Object.assign(complaint, snapshot);
      for (const e of this.estimatesRepository?.findAll().filter(e => e.complaintId === id) || []) {
        if (!previous.some(old => old.id === e.id)) this.estimatesRepository?.remove(e.id);
      }
      estimates.forEach((e, i) => {
        for (const key of Object.keys(e)) delete e[key];
        Object.assign(e, previous[i]);
      });
      for (const n of this.notificationsService?.findAll() || []) {
        if (!notificationIds.has(n.id)) this.notificationsService?.remove(n.id);
      }
      throw error;
    }
  }

  assertManager(complaintId: number, managerId?: number): Complaint {
    const complaint = this.findById(complaintId);
    const manager = managerId ? this.usersService.findRawById(managerId) : undefined;
    if (!manager || manager.role !== UserRole.MaintenanceManager || manager.approvalStatus !== 'approved' || complaint.managerId !== managerId) {
      throw new ForbiddenException('You can only manage complaints assigned to your account');
    }
    return complaint;
  }

  assertEstimateReader(id: number, role: string, userId: number): void {
    const user = this.usersService.findRawById(userId);
    if (!user || user.role !== role || user.approvalStatus !== 'approved') {
      throw new ForbiddenException('A matching approved user session is required');
    }
    if (role === 'maintenance_manager') this.assertManager(id, userId);
    if (role === 'admin') {
      const complaint = this.findById(id);
      const owner = this.usersService.findRawById(complaint.ownerId);
      if (!user.communityName || user.communityName.trim().toLowerCase() !== owner?.communityName?.trim().toLowerCase()) {
        throw new ForbiddenException('You can only view estimates for your community');
      }
    }
  }

  validateEstimateSubmission(id: number, providerId: number): Complaint {
    const complaint = this.findById(id);
    const provider = this.usersService.findRawById(providerId);
    if (!provider || provider.role !== UserRole.ServiceProvider || provider.approvalStatus !== 'approved') {
      throw new ForbiddenException('An approved service provider account is required');
    }
    if (complaint.status === ComplaintStatus.Approved && !complaint.assignedProviderId) {
      if (complaint.rejectedProviders?.includes(providerId)) {
        throw new BadRequestException('This complaint has already been declined or this estimate rejected');
      }
      return complaint;
    }
    if (complaint.assignedProviderId === providerId &&
        [ComplaintStatus.Assigned, ComplaintStatus.EstimatingCost].includes(complaint.status) &&
        !complaint.estimateApproved) return complaint;
    throw new BadRequestException('This complaint is not open for estimate submissions');
  }

  assignProvider(id: number, providerId: number, dto: AssignProviderDto = {}): Complaint {
    const complaint = this.findById(id);
    const estimate = this.estimatesRepository?.findAll().find(e =>
      e.complaintId === id && e.providerId === providerId && e.approved === null &&
      (!e.selectionStatus || e.selectionStatus === 'candidate'));
    if (complaint.status !== ComplaintStatus.Approved || complaint.assignedProviderId) {
      throw new BadRequestException('Complaint must be approved and unassigned before selecting a provider');
    }
    if (!complaint.interestedProviders?.includes(providerId) || !estimate) {
      throw new BadRequestException('Select an interested provider with a pending estimate');
    }
    this.validateEstimateSubmission(id, providerId);
    if (!Number.isFinite(estimate.estimatedCost) || estimate.estimatedCost <= 0 ||
        (estimate.selectionStatus === 'candidate' && (!estimate.notes?.trim() || !estimate.documentUrl))) {
      throw new BadRequestException('The selected provider must have a valid estimate');
    }
    const deadline = dto.deadline || complaint.deadline;
    if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(Date.parse(deadline)) || new Date(deadline).toISOString().slice(0, 10) !== deadline) {
      throw new BadRequestException('A valid assignment deadline is required');
    }
    // All repositories are synchronous, so validation and this commit cannot interleave
    // with another request. Restore both records if a collaborator fails.
    const estimates = this.estimatesRepository!.findAll().filter(e => e.complaintId === id);
    return this.atomic(id, () => {
      complaint.assignedProviderId = providerId;
      complaint.deadline = deadline;
      complaint.spAccepted = true;
      complaint.estimateSubmitted = true;
      complaint.estimateApproved = true;
      complaint.status = ComplaintStatus.InProgress;
      complaint.updatedAt = new Date().toISOString();
      estimate.approved = true;
      estimate.selectionStatus = 'selected';
      estimate.managerNote = dto.managerNote;
      estimate.reviewedAt = complaint.updatedAt;
      for (const other of estimates) {
        if (other.id !== estimate.id && other.approved === null) {
          other.selectionStatus = 'not_selected';
          other.reviewedAt = complaint.updatedAt;
        }
      }
      this.notify(providerId, id, NotificationType.ProviderAssigned, NotificationRecipient.ServiceProvider,
        `You have been assigned complaint #${id}, "${complaint.title}". Your estimate is approved; work can begin.`);
      this.notify(complaint.ownerId, id, NotificationType.ProviderAssigned, NotificationRecipient.Owner,
        `A service provider and estimate have been approved for your complaint #${id}.`);
      for (const other of estimates) {
        if (other.selectionStatus === 'not_selected') this.notify(other.providerId, id,
          NotificationType.Custom, NotificationRecipient.ServiceProvider,
          `Another provider was selected for complaint #${id}. Your submitted estimate remains in history.`);
      }
      return complaint;
    });
  }

  remove(id: number, actor?: { role?: string; id?: number }): { message: string } {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException(`Complaint with id ${id} not found`);
    }
    if (actor?.role === 'owner' && actor.id && complaint.ownerId !== actor.id) {
      throw new ForbiddenException('Owners can only delete their own complaints');
    }
    const status = (complaint.status || '').toLowerCase();
    const canDelete =
      status === ComplaintStatus.Pending ||
      status === ComplaintStatus.Rejected ||
      status === ComplaintStatus.Resolved ||
      status === ComplaintStatus.Closed;
    if (!canDelete) {
      throw new BadRequestException(
        `Complaint cannot be deleted in "${complaint.status}" status. It can only be deleted before manager acceptance or after being resolved.`,
      );
    }
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
    const estimate = this.estimatesRepository?.findAll().find(e =>
      e.complaintId === complaintId && e.providerId === providerId && e.approved === null &&
      (!e.selectionStatus || e.selectionStatus === 'candidate'));
    if (!estimate) throw new BadRequestException('Accept this complaint by submitting an estimate document, cost and description');
    this.validateEstimateSubmission(complaintId, providerId);
    if (!complaint.interestedProviders.includes(providerId)) complaint.interestedProviders.push(providerId);
    return { message: 'Estimate submitted - awaiting manager selection', queue: [...complaint.interestedProviders] };
  }

  getInterestedProviders(complaintId: number) {
    const complaint = this.findById(complaintId);
    const estimates = this.estimatesRepository?.findAll().filter(e => e.complaintId === complaintId) || [];
    return {
      complaintId,
      queue: complaint.interestedProviders || [],
      legacyProviders: (complaint.interestedProviders || []).filter(providerId => !estimates.some(e => e.providerId === providerId)).map(providerId => {
        const provider = this.usersService.findRawById(providerId);
        return { id: providerId, name: provider?.name || `Provider #${providerId}`, category: provider?.category };
      }),
      applications: estimates.map(estimate => {
        const provider = this.usersService.findRawById(estimate.providerId);
        return { provider: { id: estimate.providerId, name: provider?.name || `Provider #${estimate.providerId}`,
          category: provider?.category, phone: provider?.phone }, estimate };
      }),
    };
  }

  spAcceptAssignment(id: number, providerId?: number): Complaint {
    if (!providerId) throw new BadRequestException('providerId is required');
    this.spExpressInterest(id, providerId);
    return this.findById(id);
  }

  spRejectAssignment(id: number, reason: string): Complaint {
    return this.spReject(id, undefined, reason) as Complaint;
  }

  spReject(
    id: number,
    providerId?: number,
    reason?: string,
  ): Complaint | { message: string; rejectedProviders: number[] } {
    const complaint = this.findById(id);

    if (complaint.assignedProviderId && complaint.status !== ComplaintStatus.Assigned) {
      throw new BadRequestException('This complaint is no longer open for declining');
    }
    if (!complaint.assignedProviderId && complaint.status !== ComplaintStatus.Approved) {
      throw new BadRequestException('Only approved complaints can be declined');
    }
    // If complaint was assigned to this provider, handle assignment rejection
    if (
      complaint.status === ComplaintStatus.Assigned &&
      (!providerId || complaint.assignedProviderId === providerId)
    ) {
      complaint.assignedProviderId = undefined;
      complaint.status = ComplaintStatus.Approved;
      complaint.estimateSubmitted = false;
      complaint.estimateApproved = false;
      complaint.spAccepted = false;
      complaint.rejectionReason = reason || 'Assignment rejected by service provider';
      if (providerId) {
        if (!complaint.rejectedProviders) complaint.rejectedProviders = [];
        if (!complaint.rejectedProviders.includes(providerId)) {
          complaint.rejectedProviders.push(providerId);
        }
        if (complaint.interestedProviders) {
          complaint.interestedProviders = complaint.interestedProviders.filter(
            (p) => p !== providerId,
          );
        }
      }
      complaint.updatedAt = new Date().toISOString().split('T')[0];
      this.notify(
        complaint.managerId,
        complaint.id,
        NotificationType.Custom,
        NotificationRecipient.MaintenanceManager,
        `The assigned provider declined complaint #${complaint.id}.${reason ? ` ${reason}` : ''}`,
      );
      return complaint;
    }

    // Otherwise, decline / reject interest in available complaint
    if (!providerId) {
      throw new BadRequestException('providerId is required to record rejection');
    }

    if (!complaint.rejectedProviders) complaint.rejectedProviders = [];
    if (!complaint.rejectedProviders.includes(providerId)) {
      complaint.rejectedProviders.push(providerId);
    }
    if (complaint.interestedProviders) {
      complaint.interestedProviders = complaint.interestedProviders.filter(
        (p) => p !== providerId,
      );
    }
    const estimate = this.estimatesRepository?.findAll().find(e => e.complaintId === id && e.providerId === providerId && e.approved === null);
    if (estimate) {
      estimate.selectionStatus = 'rejected';
      estimate.approved = false;
      estimate.managerNote = reason || 'Declined by service provider';
      estimate.reviewedAt = new Date().toISOString();
    }
    complaint.updatedAt = new Date().toISOString().split('T')[0];

    return {
      message: `Provider ${providerId} rejected complaint ${id}`,
      rejectedProviders: [...complaint.rejectedProviders],
    };
  }

  markEstimateSubmitted(id: number, providerId: number): Complaint {
    const complaint = this.validateEstimateSubmission(id, providerId);
    if (!complaint.assignedProviderId) {
      this.spExpressInterest(id, providerId);
    } else {
      complaint.estimateSubmitted = true;
      complaint.estimateApproved = false;
      complaint.status = ComplaintStatus.EstimatingCost;
    }
    complaint.updatedAt = new Date().toISOString();
    this.notify(complaint.managerId, id, NotificationType.EstimateSubmitted,
      NotificationRecipient.MaintenanceManager, `An estimate was submitted for complaint #${id}; review it from the complaint.`);
    return complaint;
  }

  notifyEstimateRejected(id: number, providerId: number, note?: string): void {
    this.notify(providerId, id, NotificationType.Custom, NotificationRecipient.ServiceProvider,
      `Your estimate for complaint #${id} was rejected.${note ? ` ${note}` : ''}`);
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
    if (complaint.assignedProviderId) {
      this.notify(
        complaint.assignedProviderId,
        complaint.id,
        NotificationType.EstimateApproved,
        NotificationRecipient.ServiceProvider,
        `Your estimate for complaint #${complaint.id} was ${approved ? 'approved' : 'rejected'}.`,
      );
    }
    this.notify(
      complaint.ownerId,
      complaint.id,
      NotificationType.EstimateApproved,
      NotificationRecipient.Owner,
      `The estimate for your complaint #${complaint.id} was ${approved ? 'approved' : 'rejected'}.`,
    );
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
        c.status === ComplaintStatus.EstimatingCost ||
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

  private notify(
    userId: number,
    complaintId: number,
    type: NotificationType,
    recipient: NotificationRecipient,
    message: string,
  ): void {
    this.notificationsService?.create({ userId, complaintId, type, recipient, message });
  }
}
