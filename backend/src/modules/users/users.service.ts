import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
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
      communityName: dto.communityName,
      category: dto.category,
      block: dto.block,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });

    this.notifyAdminsAboutSignup(newUser);
    const { password, ...rest } = newUser;
    return rest;
  }

  findPending(): Omit<User, 'password'>[] {
    return this.usersRepository
      .findAll()
      .filter((user) => user.approvalStatus === 'pending')
      .map(({ password, ...user }) => user);
  }

  approve(id: number): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    user.approvalStatus = 'approved';
    const { password, ...rest } = user;
    return rest;
  }

  reject(id: number): Omit<User, 'password'> {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    user.approvalStatus = 'rejected';
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

  private notifyAdminsAboutSignup(newUser: User): void {
    if (!this.notificationsService) return;

    const approverRoles = [UserRole.Admin, 'super_user'];
    this.usersRepository
      .findAll()
      .filter((user) => approverRoles.includes(user.role))
      .forEach((admin) => {
        this.notificationsService?.createSignupApprovalNotification(
          admin.id,
          newUser.id,
          newUser.name,
          newUser.email,
          newUser.role,
          this.buildSignupDetails(newUser),
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
}
