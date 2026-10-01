import { UnauthorizedException } from '@nestjs/common';
import { NotificationRecipient } from '../notifications/dto/notification.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from './dto/user.dto';
import { UsersRepository } from './users.repository';
import { SYSTEM_SUPER_USER_ID, UsersService } from './users.service';

describe('UsersService community approval scope', () => {
  let service: UsersService;
  let usersRepository: UsersRepository;
  let notificationSpy: jest.Mock;

  beforeEach(() => {
    notificationSpy = jest.fn();
    usersRepository = new UsersRepository();
    service = new UsersService(usersRepository, {
      createSignupApprovalNotification: notificationSpy,
      markSignupRequestsRead: jest.fn(),
    } as unknown as NotificationsService);
  });

  it('routes an owner signup to every approved administrator in its community only', () => {
    const secondGreenValleyAdmin = usersRepository.create({
      name: 'Second Green Valley Admin', email: 'admin.greenvalley.2@example.com',
      password: 'admin123', role: UserRole.Admin, communityName: 'Green Valley Society',
      approvalStatus: 'approved', createdAt: '2024-01-02',
    });

    const owner = service.create({
      name: 'Green Owner', email: 'green.owner@example.com', password: 'password123',
      role: UserRole.Owner, communityName: 'Green Valley Society', propertyUnit: 'A-101',
    });

    expect(notificationSpy.mock.calls.map(([recipientId]) => recipientId))
      .toEqual([13, secondGreenValleyAdmin.id]);
    expect(notificationSpy.mock.calls.map(([, relatedUserId]) => relatedUserId))
      .toEqual([owner.id, owner.id]);
  });

  it('routes a maintenance manager signup only to its community administrator', () => {
    service.create({
      name: 'Sunrise Manager', email: 'sunrise.manager.new@example.com', password: 'password123',
      role: UserRole.MaintenanceManager, communityName: 'Sunrise Residency', block: 'A',
    });

    expect(notificationSpy.mock.calls.map(([recipientId]) => recipientId)).toEqual([14]);
  });

  it('does not create a signup notification when the selected community has no administrator', () => {
    const lakeviewAdmin = usersRepository.findById(15)!;
    lakeviewAdmin.approvalStatus = 'rejected';

    service.create({
      name: 'Lake Owner', email: 'lake.owner.new@example.com', password: 'password123',
      role: UserRole.Owner, communityName: 'Lakeview Apartments', propertyUnit: 'A-101',
    });

    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it('returns only the authenticated administrator community participants', () => {
    const greenValleyUsers = service.findAllForActor({ id: 13, role: UserRole.Admin });
    const sunriseUsers = service.findAllForActor({ id: 14, role: UserRole.Admin });

    expect(greenValleyUsers.every((user) => user.communityName === 'Green Valley Society')).toBe(true);
    expect(greenValleyUsers.some((user) => user.id === 16)).toBe(false);
    expect(sunriseUsers.every((user) => user.communityName === 'Sunrise Residency')).toBe(true);
    expect(sunriseUsers.some((user) => user.id === 1)).toBe(false);
  });

  it('does not expose administrator participant data to owners or service providers', () => {
    expect(service.findAllForActor({ id: 1, role: UserRole.Owner })).toEqual([]);
    expect(service.findAllForActor({ id: 9, role: UserRole.ServiceProvider })).toEqual([]);
  });

  it('routes an Administrator signup only to the non-repository Super User identity', () => {
    const administrator = service.create({
      name: 'New Admin', email: 'new.admin@example.com', password: 'password123',
      role: UserRole.Admin, communityName: 'Lakeview Apartments',
    });

    expect(notificationSpy).toHaveBeenCalledWith(
      SYSTEM_SUPER_USER_ID, administrator.id, administrator.name, administrator.email,
      UserRole.Admin, expect.any(String), NotificationRecipient.SuperUser,
    );
    expect(() => service.approve({ id: 15, role: UserRole.Admin }, administrator.id))
      .toThrow(UnauthorizedException);
    expect(service.approve({ id: SYSTEM_SUPER_USER_ID, role: UserRole.SuperUser }, administrator.id)
      .approvalStatus).toBe('approved');
  });

  it('routes a maintenance manager signup to all approved administrators in that community', () => {
    const secondGreenValleyAdmin = usersRepository.create({
      name: 'Second Green Valley Admin', email: 'admin.greenvalley.2@example.com',
      password: 'admin123', role: UserRole.Admin, communityName: 'Green Valley Society',
      approvalStatus: 'approved', createdAt: '2024-01-02',
    });

    const manager = service.create({
      name: 'New Green Valley Manager', email: 'green.manager.new@example.com', password: 'password123',
      role: UserRole.MaintenanceManager, communityName: 'Green Valley Society', block: 'E',
    });

    expect(notificationSpy.mock.calls.map(([recipientId]) => recipientId))
      .toEqual([13, secondGreenValleyAdmin.id]);
    expect(notificationSpy.mock.calls.map(([, relatedUserId]) => relatedUserId))
      .toEqual([manager.id, manager.id]);
  });

  it('allows multiple administrators in the same community to view identical community participants', () => {
    const secondGreenValleyAdmin = usersRepository.create({
      name: 'Second Green Valley Admin', email: 'admin.greenvalley.2@example.com',
      password: 'admin123', role: UserRole.Admin, communityName: 'Green Valley Society',
      approvalStatus: 'approved', createdAt: '2024-01-02',
    });

    const admin1Users = service.findAllForActor({ id: 13, role: UserRole.Admin });
    const admin2Users = service.findAllForActor({ id: secondGreenValleyAdmin.id, role: UserRole.Admin });

    expect(admin1Users.map((u) => u.id).sort()).toEqual(admin2Users.map((u) => u.id).sort());
    expect(admin1Users.every((u) => u.communityName === 'Green Valley Society')).toBe(true);
    expect(admin1Users.some((u) => u.communityName === 'Sunrise Residency')).toBe(false);
  });
});
