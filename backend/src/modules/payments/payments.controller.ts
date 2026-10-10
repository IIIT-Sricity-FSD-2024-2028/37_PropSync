import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get all payments (Manager/Admin)' })
  @ApiQuery({ name: 'ownerId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Payment list' })
  findAll(@Query('ownerId') ownerId?: number) {
    return this.paymentsService.findAll(ownerId ? +ownerId : undefined);
  }

  @Get('owner/:ownerId')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get payment history for an owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Owner payment history' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.paymentsService.findByOwner(ownerId);
  }

  @Get(':id')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Payment record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @Roles(Role.Owner)
  @ApiOperation({ summary: 'Process a payment (Owner only)' })
  @ApiResponse({ status: 201, description: 'Payment processed' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a payment record (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
