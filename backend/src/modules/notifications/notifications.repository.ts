import { Injectable } from '@nestjs/common';
import type { Notification } from './notifications.service';
import {
  NotificationRecipient,
  NotificationType,
} from './dto/notification.dto';

@Injectable()
export class NotificationsRepository {
  private notifications: Notification[] = [
    {
      id: 1,
      userId: 1,
      complaintId: 1,
      message:
        'Your complaint "Water Leakage in Block A" has been submitted successfully.',
      type: NotificationType.ComplaintSubmitted,
      recipient: NotificationRecipient.Owner,
      status: 'unread',
      createdAt: '2024-03-08T09:00:00Z',
    },
    {
      id: 2,
      userId: 5,
      complaintId: 1,
      message:
        'New complaint submitted by Raj Kumar: "Water Leakage in Block A".',
      type: NotificationType.ComplaintSubmitted,
      recipient: NotificationRecipient.MaintenanceManager,
      status: 'unread',
      createdAt: '2024-03-08T09:01:00Z',
    },
    {
      id: 3,
      userId: 2,
      complaintId: 2,
      message: 'Your complaint "Street Light Not Working" has been approved.',
      type: NotificationType.ComplaintApproved,
      recipient: NotificationRecipient.Owner,
      status: 'read',
      createdAt: '2024-03-09T10:30:00Z',
    },
    {
      id: 4,
      userId: 10,
      complaintId: 4,
      message:
        'You have been assigned to complaint C-4: "Lift Not Working".',
      type: NotificationType.ProviderAssigned,
      recipient: NotificationRecipient.ServiceProvider,
      status: 'unread',
      createdAt: '2024-03-10T11:00:00Z',
    },
    {
      id: 5,
      userId: 6,
      complaintId: 3,
      message: 'Service estimate submitted for complaint C-3.',
      type: NotificationType.EstimateSubmitted,
      recipient: NotificationRecipient.MaintenanceManager,
      status: 'unread',
      createdAt: '2024-03-10T14:00:00Z',
    },
    {
      id: 6,
      userId: 2,
      complaintId: 4,
      message:
        'Overdue alert: Complaint C-4 "Lift Not Working" has exceeded its deadline.',
      type: NotificationType.Overdue,
      recipient: NotificationRecipient.Owner,
      status: 'unread',
      createdAt: '2024-03-13T08:00:00Z',
    },
    {
      id: 7,
      userId: 11,
      complaintId: 5,
      message:
        'Bill submitted for complaint C-5: "AC Not Cooling - Tower B, Apt 305".',
      type: NotificationType.PaymentDue,
      recipient: NotificationRecipient.ServiceProvider,
      status: 'read',
      createdAt: '2024-03-13T12:00:00Z',
    },
    {
      id: 8,
      userId: 13,
      message: 'Daily mock data check: all actor accounts are active.',
      type: NotificationType.Custom,
      recipient: NotificationRecipient.Admin,
      status: 'unread',
      createdAt: '2024-03-14T09:00:00Z',
    },
  ];

  private idCounter = 9;

  findAll(): Notification[] {
    return [...this.notifications];
  }

  findById(id: number): Notification | undefined {
    return this.notifications.find((notification) => notification.id === id);
  }

  create(notification: Omit<Notification, 'id'>): Notification {
    const newNotification = { ...notification, id: this.idCounter++ };
    this.notifications.push(newNotification);
    return newNotification;
  }

  remove(id: number): boolean {
    const index = this.notifications.findIndex(
      (notification) => notification.id === id,
    );
    if (index === -1) return false;
    this.notifications.splice(index, 1);
    return true;
  }

  removeByUser(userId: number): number {
    const before = this.notifications.length;
    this.notifications = this.notifications.filter(
      (notification) => notification.userId !== userId,
    );
    return before - this.notifications.length;
  }
}
