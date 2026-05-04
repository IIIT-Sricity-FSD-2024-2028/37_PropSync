import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto, UpdateUserDto } from './users.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/roles.enum';

@ApiTags('Users & Auth')
@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── LOGIN (no role restriction) ──────────────────────────
  @Post('login')
  @ApiOperation({
    summary:
      'Login — validates credentials and returns role-based redirect info',
  })
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  // ─── SIGNUP / REGISTER ─────────────────────────────────────
  @Post('users/register')
  @ApiOperation({ summary: 'Register a new user (public)' })
  register(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ─── PARTICIPANTS (admin / super_user) ────────────────────
  @Get('participants')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get all participants (admin/superuser only)' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  getParticipants() {
    return this.usersService.getParticipants();
  }

  @Post('participants')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Add a participant (admin/superuser only)' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  createParticipant(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('participants/:id/status')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Activate/deactivate a participant' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'Active' | 'Inactive' },
  ) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Delete('participants/:id')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete a participant (admin/superuser only)' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  removeParticipant(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ─── USERS (admin) ────────────────────────────────────────
  @Get('users')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER, Role.MAINTENANCE_MANAGER)
  @ApiOperation({ summary: 'Get all users with optional role filter' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('users/:id')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER, Role.MAINTENANCE_MANAGER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user | maintenance_manager',
    required: true,
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('users/:id')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Update user' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete('users/:id')
  @Roles(Role.ADMINISTRATOR, Role.SUPER_USER)
  @ApiOperation({ summary: 'Delete user' })
  @ApiSecurity('role-header')
  @ApiHeader({
    name: 'role',
    description: 'administrator | super_user',
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ─── PROFILE (self-service) ────────────────────────────────
  @Get('profile')
  @Roles(
    Role.OWNER,
    Role.MAINTENANCE_MANAGER,
    Role.SERVICE_PROVIDER,
    Role.ADMINISTRATOR,
    Role.SUPER_USER,
  )
  @ApiOperation({ summary: 'Get own profile by email header' })
  @ApiSecurity('role-header')
  @ApiHeader({ name: 'role', description: 'Any role', required: true })
  @ApiHeader({
    name: 'user-email',
    description: 'Logged-in user email',
    required: true,
  })
  getProfile(@Headers('user-email') email: string) {
    const users = this.usersService.findAll();
    const user = (users as any[]).find(
      (u) => u.email?.toLowerCase() === email?.toLowerCase(),
    );
    return user || { message: 'Profile not found' };
  }

  @Patch('profile')
  @Roles(
    Role.OWNER,
    Role.MAINTENANCE_MANAGER,
    Role.SERVICE_PROVIDER,
    Role.ADMINISTRATOR,
    Role.SUPER_USER,
  )
  @ApiOperation({ summary: 'Update own profile' })
  @ApiSecurity('role-header')
  @ApiHeader({ name: 'role', description: 'Any role', required: true })
  @ApiHeader({
    name: 'user-email',
    description: 'Logged-in user email',
    required: true,
  })
  updateProfile(
    @Headers('user-email') email: string,
    @Body() dto: UpdateUserDto,
  ) {
    const users = this.usersService.findAll() as any[];
    const user = users.find(
      (u) => u.email?.toLowerCase() === email?.toLowerCase(),
    );
    if (!user) return { message: 'User not found' };
    return this.usersService.update(user.id, dto);
  }
}
