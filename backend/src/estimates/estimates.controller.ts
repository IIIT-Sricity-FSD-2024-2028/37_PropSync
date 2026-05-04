import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { EstimatesService } from './estimates.service';

@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  create(@Body() body: any) {
    return this.estimatesService.create(body);
  }

  @Get()
  findAll() {
    return this.estimatesService.findAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected' }) {
    return this.estimatesService.updateStatus(id, body.status);
  }
}
