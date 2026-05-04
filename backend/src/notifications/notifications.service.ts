import { Injectable, NotFoundException } from '@nestjs/common';
import { getNotifications, setNotifications, generateId, Notification, Role } from '../data-store';

@Injectable()
export class NotificationsService {
  findAll(role?: string, userEmail?: string): Notification[] {
    const all = getNotifications();
    return all.filter((n) => {
      if (n.forRole === 'all') return true;
      if (n.forRole === role) {
        if (n.forUser && n.forUser !== userEmail) return false;
        return true;
      }
      return false;
    });
  }

  create(data: Partial<Notification>): Notification {
    const notifications = getNotifications();
    const newNotif: Notification = {
      id: generateId('N', notifications),
      title: data.title || 'Notification',
      message: data.message || '',
      type: data.type || 'system',
      forRole: data.forRole || 'all',
      forUser: data.forUser,
      forCategory: data.forCategory,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications([newNotif, ...notifications]);
    return newNotif;
  }

  markRead(id: string): Notification {
    const notifications = getNotifications();
    const index = notifications.findIndex((n) => String(n.id) === id);
    if (index === -1) throw new NotFoundException(`Notification ${id} not found`);

    notifications[index].isRead = true;
    setNotifications(notifications);
    return notifications[index];
  }

  markAllRead(role?: string, userEmail?: string) {
    const notifications = getNotifications();
    notifications.forEach((n) => {
      if (n.forRole === 'all' || n.forRole === role) {
        if (!n.forUser || n.forUser === userEmail) {
          n.isRead = true;
        }
      }
    });
    setNotifications(notifications);
    return { message: 'All notifications marked as read' };
  }

  remove(id: string) {
    const notifications = getNotifications();
    const filtered = notifications.filter((n) => String(n.id) !== id);
    setNotifications(filtered);
    return { message: `Notification ${id} deleted` };
  }
}
