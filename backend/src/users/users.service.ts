import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { getUsers, setUsers, generateId, User } from '../data-store';
import { CreateUserDto, LoginDto, UpdateUserDto } from './users.dto';

// ✅ Strongly typed roles
export type UserRole =
  | 'owner'
  | 'maintenance_manager'
  | 'service_provider'
  | 'administrator'
  | 'super_user';

@Injectable()
export class UsersService {
  // 🔐 LOGIN
  login(dto: LoginDto) {
    const users = getUsers();

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === dto.email.toLowerCase() &&
        u.password === dto.password &&
        u.role.toLowerCase() === dto.role.toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials or role mismatch');
    }

    const { password, ...safeUser } = user;

    return {
      message: 'Login successful',
      user: safeUser,
      role: user.role,
    };
  }

  // 📄 GET ALL USERS
  findAll(role?: string) {
    const users = getUsers();

    if (role) {
      return users
        .filter((u) => u.role === role.toLowerCase())
        .map(({ password, ...safeUser }) => safeUser);
    }

    return users.map(({ password, ...safeUser }) => safeUser);
  }

  // 🔍 GET ONE USER
  findOne(id: string) {
    const user = getUsers().find((u) => u.id === id);

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  // ➕ CREATE USER
  create(dto: CreateUserDto) {
    const users = getUsers();

    const exists = users.find(
      (u) =>
        u.email.toLowerCase() === dto.email.toLowerCase() &&
        u.role.toLowerCase() === dto.role.toLowerCase(),
    );

    if (exists) {
      throw new ConflictException(
        'User with this email and role already exists',
      );
    }

    const newUser: User = {
      id: generateId('U', users),
      ...dto,
      role: dto.role,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);

    const { password, ...safeUser } = newUser;

    return {
      message: 'User created successfully',
      user: safeUser,
    };
  }

  // ✏️ UPDATE USER
  update(id: string, dto: UpdateUserDto) {
    const users = getUsers();

    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new NotFoundException(`User ${id} not found`);
    }

    users[index] = { ...users[index], ...dto };

    setUsers(users);

    const { password, ...safeUser } = users[index];

    return {
      message: 'User updated',
      user: safeUser,
    };
  }

  // ❌ DELETE USER
  remove(id: string) {
    const users = getUsers();

    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new NotFoundException(`User ${id} not found`);
    }

    users.splice(index, 1);

    setUsers(users);

    return { message: `User ${id} deleted` };
  }

  // 👥 GET PARTICIPANTS
  getParticipants() {
    return getUsers()
      .filter((u) => u.role !== 'administrator' && u.role !== 'super_user')
      .map(({ password, ...safeUser }) => ({
        ...safeUser,
        roleDisplay: this.getRoleDisplay(safeUser.role),
      }));
  }

  // 🔄 UPDATE STATUS
  updateStatus(id: string, status: 'Active' | 'Inactive') {
    return this.update(id, { status } as UpdateUserDto);
  }

  // ✅ FINAL FIXED METHOD (NO ERRORS)
  private getRoleDisplay(role: string): string {
    const map = {
      owner: 'Property Owner',
      maintenance_manager: 'Maintenance Manager',
      service_provider: 'Service Provider',
      administrator: 'Administrator',
      super_user: 'Super User',
    } as const;

    return map[role as keyof typeof map] ?? role;
  }
}
