import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateNotificationDto,
  NotificationRecipient,
  NotificationType,
} from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';

export interface Notification {
  id: number;
  userId: number;
  complaintId?: number;
  relatedUserId?: number;
  message: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  status: 'read' | 'unread';
  createdAt: string;
}

export interface NotificationView extends Notification {
  title: string;
  time: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  findAll(userId?: number, status?: 'read' | 'unread'): NotificationView[] {
    let result = this.notificationsRepository.findAll();
    if (userId !== undefined && !Number.isNaN(userId)) {
      result = result.filter((notification) => notification.userId === userId);
    }
    if (status) {
      result = result.filter((notification) => notification.status === status);
    }
    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).map((notification) => this.toView(notification));
  }

  findById(id: number): NotificationView {
    const notification = this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return this.toView(notification);
  }

  create(dto: CreateNotificationDto): Notification {
    return this.notificationsRepository.create({
      userId: dto.userId,
      complaintId: dto.complaintId,
      relatedUserId: dto.relatedUserId,
      message: dto.message,
      type: dto.type,
      recipient: dto.recipient,
      status: 'unread',
      createdAt: new Date().toISOString(),
    });
  }

  createSignupApprovalNotification(
    adminUserId: number,
    pendingUserId: number,
    userName: string,
    userEmail: string,
    requestedRole: string,
    details?: string,
    recipient: NotificationRecipient = NotificationRecipient.Admin,
  ): Notification {
    return this.create({
      userId: adminUserId,
      relatedUserId: pendingUserId,
      message: [
        `New user ${userName} (${userEmail}) requested signup as ${requestedRole}.`,
        details,
      ]
        .filter(Boolean)
        .join(' '),
      type: NotificationType.Custom,
      recipient,
    });
  }

  markRead(id: number): Notification {
    const notification = this.findById(id);
    notification.status = 'read';
    return notification;
  }

  markReadForUser(userId: number, id: number): Notification {
    const notification = this.notificationsRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    notification.status = 'read';
    return notification;
  }

  markAllRead(userId: number): { updated: number } {
    let count = 0;
    this.notificationsRepository.findAll().forEach((notification) => {
      if (notification.userId === userId && notification.status === 'unread') {
        notification.status = 'read';
        count++;
      }
    });
    return { updated: count };
  }

  /**
   * A signup request is actionable only while its related account is pending.
   * Once an administrator has made a decision, close every matching request
   * notification so another browser session cannot present it as actionable.
   */
  markSignupRequestsRead(relatedUserId: number): void {
    this.notificationsRepository.findAll().forEach((notification) => {
      if (
        notification.relatedUserId === relatedUserId &&
        [NotificationRecipient.Admin, NotificationRecipient.SuperUser].includes(notification.recipient) &&
        notification.status === 'unread'
      ) {
        notification.status = 'read';
      }
    });
  }

  remove(id: number): { message: string } {
    if (!this.notificationsRepository.remove(id)) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return { message: `Notification ${id} deleted` };
  }

  clearAll(userId: number): { message: string } {
    const removed = this.notificationsRepository.removeByUser(userId);
    return { message: `Cleared ${removed} notifications for user ${userId}` };
  }

  private toView(notification: Notification): NotificationView {
    const titles: Record<NotificationType, string> = {
      [NotificationType.ComplaintSubmitted]: 'New Complaint Submitted',
      [NotificationType.ComplaintApproved]: 'Complaint Approved',
      [NotificationType.ComplaintRejected]: 'Complaint Rejected',
      [NotificationType.ProviderAssigned]: 'Service Provider Assigned',
      [NotificationType.EstimateSubmitted]: 'Estimate Submitted',
      [NotificationType.EstimateApproved]: 'Estimate Reviewed',
      [NotificationType.WorkCompleted]: 'Complaint Status Updated',
      [NotificationType.PaymentDue]: 'Payment Update',
      [NotificationType.Overdue]: 'Deadline Alert',
      [NotificationType.Custom]: 'System Update',
    };
    return {
      ...notification,
      title: titles[notification.type],
      time: new Date(notification.createdAt).toLocaleString(),
    };
  }
}
