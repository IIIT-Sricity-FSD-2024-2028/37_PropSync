import { Controller, Get, Post, Patch, Body, Param, Headers } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { Status } from '../data-store';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) { }

  @Get()
  findAll(
    @Headers('role') role: string,
    @Headers('user-email') userEmail: string,
  ) {
    return this.complaintsService.findAll(role || 'service_provider', userEmail);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.complaintsService.create(body);
  }

  @Patch(':id/:status')
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
    @Headers('user-email') userEmail: string,
    @Body('reason') reason?: string,
  ) {
    // Capitalise first letter to match the Status enum, e.g. 'assigned' -> 'Assigned'
    const formattedStatus = (status.charAt(0).toUpperCase() + status.slice(1)) as Status;
    return this.complaintsService.updateStatus(id, formattedStatus, reason, userEmail);
  }
}
