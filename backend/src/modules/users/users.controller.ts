import {
  Body,
  Controller,
  Delete,
  Get,
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
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.Admin, Role.MaintenanceManager, Role.Owner, Role.ServiceProvider)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  @ApiResponse({ status: 401, description: 'Missing role header' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query('role') role?: UserRole) {
    if (role) return this.usersService.findByRole(role);
    return this.usersService.findAll();
  }

  @Post('login')
  @Roles(Role.Admin, Role.MaintenanceManager, Role.Owner, Role.ServiceProvider)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: any) {
    return this.usersService.login(dto);
  }

  @Get('pending')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get pending signup requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending users returned' })
  findPending() {
    return this.usersService.findPending();
  }

  @Patch(':id/approve')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Approve a pending user (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User approved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Reject a pending user (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User rejected' })
  @ApiResponse({ status: 404, description: 'User not found' })
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.reject(id);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.MaintenanceManager, Role.Owner, Role.ServiceProvider)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or missing required fields' })
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
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
}
