import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Get notifications for a user' })
  @ApiQuery({ name: 'userId', type: Number, required: false })
  @ApiQuery({ name: 'status', enum: ['read', 'unread'], required: false })
  @ApiResponse({ status: 200, description: 'Notification list' })
  findAll(
    @Query('userId') userId?: number,
    @Query('status') status?: 'read' | 'unread',
  ) {
    return this.notificationsService.findAll(userId ? +userId : undefined, status);
  }

  @Get(':id')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Notification details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.findById(id);
  }

  @Post()
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Send a notification (Manager/Admin only)' })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id);
  }

  @Patch('user/:userId/mark-all-read')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({ status: 200, description: 'All notifications marked read' })
  markAllRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }

  @Delete('user/:userId/clear')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Clear all notifications for a user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({ status: 200, description: 'All notifications cleared' })
  clearAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.clearAll(userId);
  }
}
