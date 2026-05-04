import { Controller, Get, Post, Patch, Body, Param, Headers, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Headers('role') role: string,
    @Headers('user-email') userEmail: string,
  ) {
    return this.notificationsService.findAll(role, userEmail);
  }

  @Post()
  create(@Body() body: any) {
    return this.notificationsService.create(body);
  }

  @Patch('read-all')
  markAllRead(
    @Headers('role') role: string,
    @Headers('user-email') userEmail: string,
  ) {
    return this.notificationsService.markAllRead(role, userEmail);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
