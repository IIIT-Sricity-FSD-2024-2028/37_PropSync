import { NotificationRecipient, NotificationType } from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: NotificationsRepository;

  beforeEach(() => {
    repository = new NotificationsRepository();
    service = new NotificationsService(repository);
  });

  it('correctly filters notifications for Super User (userId: 0)', () => {
    service.createSignupApprovalNotification(
      0,
      33,
      'New Admin',
      'admin@propsync.com',
      'admin',
      'Community: Green Valley',
      NotificationRecipient.SuperUser,
    );
    service.createSignupApprovalNotification(
      13,
      34,
      'New Owner',
      'owner@propsync.com',
      'owner',
      'Community: Green Valley',
      NotificationRecipient.Admin,
    );

    const superUserNotifs = service.findAll(0);
    const adminNotifs = service.findAll(13);

    expect(superUserNotifs).toHaveLength(1);
    expect(superUserNotifs[0].userId).toBe(0);
    expect(superUserNotifs[0].recipient).toBe(NotificationRecipient.SuperUser);

    expect(adminNotifs.length).toBeGreaterThanOrEqual(1);
    expect(adminNotifs.every((n) => n.userId === 13)).toBe(true);
    expect(adminNotifs.some((n) => n.relatedUserId === 34)).toBe(true);
  });

  it('marks notifications read for user and closes pending signup notifications on decision', () => {
    const notif = service.createSignupApprovalNotification(
      13,
      35,
      'Pending User',
      'pending@propsync.com',
      'owner',
      'Unit: A-101',
    );

    expect(notif.status).toBe('unread');
    service.markSignupRequestsRead(35);

    const updated = service.findById(notif.id);
    expect(updated.status).toBe('read');
  });
});
