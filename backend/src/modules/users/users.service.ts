import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipient } from '../notifications/dto/notification.dto';
import { CreateUserDto, UpdateUserDto, UserRole } from './dto/user.dto';
import { UsersRepository } from './users.repository';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  propertyUnit?: string;
  communityName?: string;
  category?: string;
  block?: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface RequestActor {
  id: number;
  role: UserRole;
}

/** The Super User is a platform identity, deliberately not a repository user. */
export const SYSTEM_SUPER_USER_ID = 0;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  findAll(): Omit<User, 'password'>[] {
    return this.usersRepository
      .findAll()
      .map(({ password, ...user }) => user);
  }

  findById(id: number): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    const { password, ...rest } = user;
    return rest;
  }

  findByRole(role: UserRole): Omit<User, 'password'>[] {
    return this.usersRepository
      .findAll()
      .filter((user) => user.role === role)
      .map(({ password, ...user }) => user);
  }

  findCommunities(): string[] {
    return this.usersRepository.findCommunities();
  }

  findAllForActor(actor: RequestActor): Omit<User, 'password'>[] {
    const requester = this.getApprovedRequester(actor);
    const allUsers = this.usersRepository.findAll();
    const users = requester.role === UserRole.SuperUser
      ? allUsers
      : requester.role === UserRole.Admin
        ? allUsers.filter(
            (user) =>
              user.communityName?.trim().toLowerCase() === requester.communityName?.trim().toLowerCase() &&
              user.role !== UserRole.SuperUser,
          )
        // Maintenance managers use this endpoint to choose a service provider;
        // they must not receive community participant or administrator records.
        : requester.role === UserRole.MaintenanceManager
          ? allUsers.filter((user) => user.role === UserRole.ServiceProvider)
          // Owners and service providers have no participant-management scope.
          : [];
    return users.map(({ password, ...user }) => user);
  }

  findRawById(id: number): User | undefined {
    return this.usersRepository.findById(id);
  }

  login(dto: {
    email: string;
    password: string;
    role: UserRole;
  }): Omit<User, 'password'> {
    const user = this.usersRepository
      .findAll()
      .find(
        (item) =>
          item.email.toLowerCase() === dto.email.toLowerCase() &&
          item.role === dto.role,
      );

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.approvalStatus === 'pending') {
      throw new UnauthorizedException(
        'Your account is waiting for admin approval',
      );
    }
    if (user.approvalStatus === 'rejected') {
      throw new UnauthorizedException('Your account request was rejected');
    }

    const { password, ...rest } = user;
    return rest;
  }

  create(dto: CreateUserDto): Omit<User, 'password'> {
    if (dto.role === UserRole.Owner) {
      if (!dto.propertyUnit || !dto.communityName) {
        throw new BadRequestException(
          'propertyUnit and communityName are required for Owner role',
        );
      }
    }
    if (dto.role === UserRole.MaintenanceManager && (!dto.communityName || !dto.block)) {
      throw new BadRequestException(
        'communityName and block are required for Maintenance Manager role',
      );
    }
    if (dto.role === UserRole.Admin && !dto.communityName) {
      throw new BadRequestException('communityName is required for Administrator role');
    }
    if (
      [UserRole.Owner, UserRole.MaintenanceManager, UserRole.Admin].includes(dto.role) &&
      dto.communityName &&
      !this.usersRepository.hasCommunity(dto.communityName)
    ) {
      throw new BadRequestException('Please select a valid community name');
    }
    if (dto.role === UserRole.ServiceProvider && !dto.category) {
      throw new BadRequestException(
        'category is required for Service Provider role',
      );
    }

    const exists = this.usersRepository
      .findAll()
      .find(
        (user) =>
          user.email.toLowerCase() === dto.email.toLowerCase() &&
          user.role === dto.role,
      );

    if (exists) {
      throw new ConflictException(
        `User with email "${dto.email}" and role "${dto.role}" already exists`,
      );
    }

    const newUser = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: dto.role,
      propertyUnit: dto.propertyUnit,
      communityName: dto.communityName
        ? this.usersRepository.normalizeCommunityName(dto.communityName)
        : undefined,
      category: dto.category,
      block: dto.block,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });

    this.notifyAdminsAboutSignup(newUser);
    const { password, ...rest } = newUser;
    return rest;
  }

  findPendingForActor(actor: RequestActor): Omit<User, 'password'>[] {
    const requester = this.getApprovedRequester(actor);
    return this.usersRepository.findAll()
      .filter((user) => {
        if (user.approvalStatus !== 'pending') return false;
        if (requester.role === UserRole.SuperUser) return user.role === UserRole.Admin;
        return (
          user.communityName?.trim().toLowerCase() === requester.communityName?.trim().toLowerCase() &&
          [UserRole.Owner, UserRole.MaintenanceManager].includes(user.role)
        );
      })
      .map(({ password, ...user }) => user);
  }

  approve(actor: RequestActor, id: number): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    if (user.approvalStatus !== 'pending') {
      throw new BadRequestException('Only pending signup requests can be approved');
    }

    this.assertMayDecide(actor, user);
    user.approvalStatus = 'approved';
    this.notificationsService?.markSignupRequestsRead(user.id);
    const { password, ...rest } = user;
    return rest;
  }

  reject(actor: RequestActor, id: number): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    if (user.approvalStatus !== 'pending') {
      throw new BadRequestException('Only pending signup requests can be rejected');
    }

    this.assertMayDecide(actor, user);
    user.approvalStatus = 'rejected';
    this.notificationsService?.markSignupRequestsRead(user.id);
    const { password, ...rest } = user;
    return rest;
  }

  update(id: number, dto: UpdateUserDto): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    Object.assign(user, dto);
    const { password, ...rest } = user;
    return rest;
  }

  remove(id: number): { message: string } {
    if (!this.usersRepository.remove(id)) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return { message: `User ${id} deleted successfully` };
  }

  private getApprovedRequester(actor: RequestActor): User {
    if (actor.role === UserRole.SuperUser && actor.id === SYSTEM_SUPER_USER_ID) {
      return {
        id: SYSTEM_SUPER_USER_ID,
        name: 'Super User',
        email: 'superuser@propsync.platform',
        password: '',
        role: UserRole.SuperUser,
        approvalStatus: 'approved',
        createdAt: '',
      };
    }
    const requester = this.usersRepository.findById(actor.id);
    if (!requester || requester.role !== actor.role || requester.approvalStatus !== 'approved') {
      throw new UnauthorizedException('Invalid or inactive requesting user');
    }
    return requester;
  }

  private assertMayDecide(actor: RequestActor, pendingUser: User): void {
    const requester = this.getApprovedRequester(actor);
    const allowed = requester.role === UserRole.SuperUser
      ? pendingUser.role === UserRole.Admin
      : requester.role === UserRole.Admin &&
        pendingUser.communityName?.trim().toLowerCase() === requester.communityName?.trim().toLowerCase() &&
        [UserRole.Owner, UserRole.MaintenanceManager].includes(pendingUser.role);
    if (!allowed) {
      throw new UnauthorizedException('You cannot approve requests outside your assigned community');
    }
  }

  private notifyAdminsAboutSignup(newUser: User): void {
    if (!this.notificationsService) return;

    if (newUser.role === UserRole.Admin) {
      this.notificationsService.createSignupApprovalNotification(
        SYSTEM_SUPER_USER_ID,
        newUser.id,
        newUser.name,
        newUser.email,
        newUser.role,
        this.buildSignupDetails(newUser),
        NotificationRecipient.SuperUser,
      );
      return;
    }

    if (![UserRole.Owner, UserRole.MaintenanceManager].includes(newUser.role)) {
      return;
    }

    this.usersRepository
      .findApprovedAdministratorsByCommunity(newUser.communityName)
      .forEach((admin) => {
        this.notificationsService?.createSignupApprovalNotification(
          admin.id,
          newUser.id,
          newUser.name,
          newUser.email,
          newUser.role,
          this.buildSignupDetails(newUser),
          admin.role === UserRole.SuperUser
            ? NotificationRecipient.SuperUser
            : NotificationRecipient.Admin,
        );
      });
  }

  private buildSignupDetails(user: User): string {
    const details = [
      user.phone ? `Phone: ${user.phone}` : '',
      user.propertyUnit ? `Property Unit: ${user.propertyUnit}` : '',
      user.communityName ? `Community: ${user.communityName}` : '',
      user.block ? `Block: ${user.block}` : '',
      user.category ? `Category: ${user.category}` : '',
    ].filter(Boolean);

    return details.length ? details.join(', ') : '';
  }

  private getBlockFromUnit(propertyUnit?: string): string | undefined {
    return propertyUnit?.trim().charAt(0).toUpperCase();
  }
}
