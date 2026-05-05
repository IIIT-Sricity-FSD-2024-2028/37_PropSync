import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BillsService } from './bills.service';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  findAll() {
    return this.billsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.billsService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'approved' | 'paid' | 'rejected' }) {
    return this.billsService.updateStatus(id, body.status);
  }
}
