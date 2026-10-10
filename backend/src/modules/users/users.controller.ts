import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserDto, UpdateUserDto, UserRole } from './dto/user.dto';
import { RequestActor, UsersService } from './users.service';

@ApiTags('Users')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description:
    'User role: owner | maintenance_manager | service_provider | admin | super_user',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(
    Role.Admin,
    Role.SuperUser,
    Role.MaintenanceManager,
    Role.Owner,
    Role.ServiceProvider,
  )
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'role',
    enum: UserRole,
    required: false,
    description: 'Filter by role',
  })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  @ApiResponse({ status: 401, description: 'Missing role header' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(
    @Headers() headers: Record<string, string>,
    @Query('role') role?: UserRole,
  ) {
    const actor = this.actorFromHeaders(headers);
    const users = this.usersService.findAllForActor(actor);
    return role ? users.filter((user) => user.role === role) : users;
  }

  @Get('communities')
  @Roles(
    Role.Admin,
    Role.SuperUser,
    Role.MaintenanceManager,
    Role.Owner,
    Role.ServiceProvider,
  )
  @ApiOperation({
    summary: 'List available communities for community-scoped signup',
  })
  findCommunities() {
    return this.usersService.findCommunities();
  }

  @Post('login')
  @Roles(
    Role.Admin,
    Role.SuperUser,
    Role.MaintenanceManager,
    Role.Owner,
    Role.ServiceProvider,
  )
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: any) {
    return this.usersService.login(dto);
  }

  @Get('pending')
  @Roles(Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Get pending signup requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending users returned' })
  findPending(@Headers() headers: Record<string, string>) {
    return this.usersService.findPendingForActor(
      this.actorFromHeaders(headers),
    );
  }

  @Patch(':id/approve')
  @Roles(Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Approve a pending user (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User approved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  approve(
    @Headers() headers: Record<string, string>,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.approve(this.actorFromHeaders(headers), id);
  }

  @Patch(':id/reject')
  @Roles(Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Reject a pending user (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User rejected' })
  @ApiResponse({ status: 404, description: 'User not found' })
  reject(
    @Headers() headers: Record<string, string>,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.reject(this.actorFromHeaders(headers), id);
  }

  @Get(':id')
  @Roles(
    Role.Admin,
    Role.SuperUser,
    Role.MaintenanceManager,
    Role.Owner,
    Role.ServiceProvider,
  )
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(
    Role.Admin,
    Role.SuperUser,
    Role.MaintenanceManager,
    Role.Owner,
    Role.ServiceProvider,
  )
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or missing required fields',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Owner, Role.MaintenanceManager, Role.ServiceProvider)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  private actorFromHeaders(headers: Record<string, string>): RequestActor {
    const id = Number(headers['x-user-id']);
    const role = headers['role'] as UserRole;
    if (
      !Number.isInteger(id) ||
      id < 0 ||
      (id === 0 && role !== UserRole.SuperUser)
    ) {
      throw new BadRequestException('x-user-id header is required');
    }
    return { id, role };
  }
}
