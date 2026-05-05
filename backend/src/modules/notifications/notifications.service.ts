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

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  findAll(userId?: number, status?: 'read' | 'unread'): Notification[] {
    let result = this.notificationsRepository.findAll();
    if (userId) {
      result = result.filter((notification) => notification.userId === userId);
    }
    if (status) {
      result = result.filter((notification) => notification.status === status);
    }
    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findById(id: number): Notification {
    const notification = this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
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
      recipient: NotificationRecipient.Admin,
    });
  }

  markRead(id: number): Notification {
    const notification = this.findById(id);
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
}
