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
import { CreateBillDto } from './dto/bill.dto';
import { BillsService } from './bills.service';

@ApiTags('Service Bills')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @Roles(Role.MaintenanceManager, Role.Owner, Role.Admin)
  @ApiOperation({ summary: 'Get all service bills' })
  @ApiQuery({ name: 'complaintId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of bills' })
  findAll(@Query('complaintId') complaintId?: number) {
    return this.billsService.findAll(complaintId ? +complaintId : undefined);
  }

  @Get(':id')
  @Roles(Role.MaintenanceManager, Role.Owner, Role.Admin)
  @ApiOperation({ summary: 'Get bill by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Bill details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.findById(id);
  }

  @Post()
  @Roles(Role.ServiceProvider)
  @ApiOperation({ summary: 'Submit a service bill after completing work (Service Provider only)' })
  @ApiResponse({ status: 201, description: 'Bill created' })
  create(@Body() dto: CreateBillDto) {
    return this.billsService.create(dto);
  }

  @Patch(':id/mark-paid')
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Mark a bill as paid' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Bill marked as paid' })
  markPaid(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.markPaid(id);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a bill (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.remove(id);
  }
}
