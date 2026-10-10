import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { CreateMaintenanceDto, SettleFeeDto, SubmitTransactionDto } from './dto/maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance Payments')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role for this module: owner | maintenance_manager | super_user | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('create')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin)
  @ApiOperation({ summary: 'Create monthly maintenance charges for owners in the manager block' })
  @ApiResponse({ status: 201, description: 'Charges created for owners in the manager block' })
  @ApiResponse({ status: 409, description: 'A charge already exists for the month' })
  create(@Headers('x-user-id') userId: string, @Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.createMonthlyCharges(dto, this.optionalUserId(userId));
  }

  @Get()
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Get all maintenance payments for manager view' })
  @ApiQuery({ name: 'managerId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Maintenance payment list' })
  findAll(@Headers('x-user-id') userId: string, @Query('managerId') managerId?: string) {
    const mgrId = managerId ? Number(managerId) : this.optionalUserId(userId);
    return mgrId
      ? this.maintenanceService.findAllForManager(mgrId)
      : this.maintenanceService.findAll();
  }

  @Get('revenue')
  @Roles(Role.SuperUser, Role.Admin)
  @ApiOperation({ summary: 'Get PropSync platform revenue from settled maintenance payments (Super User only)' })
  @ApiResponse({ status: 200, description: 'Maintenance collection totals and settled platform revenue breakdown' })
  getPlatformRevenue() {
    return this.maintenanceService.getPlatformRevenue();
  }

  @Get('owner/:ownerId')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Get maintenance payments for one owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Owner maintenance payment history' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.maintenanceService.findByOwner(ownerId);
  }

  @Patch(':id/submit-transaction')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Manager, Role.Admin)
  @ApiOperation({ summary: 'Owner submits payment transaction proof ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Transaction ID submitted, payment remains pending' })
  submitTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitTransactionDto,
  ) {
    return this.maintenanceService.submitTransaction(id, dto);
  }

  @Patch(':id/mark-paid')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin)
  @ApiOperation({ summary: 'Mark a maintenance payment as paid by manager' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Maintenance payment marked paid' })
  @ApiResponse({ status: 404, description: 'Maintenance payment not found' })
  markPaid(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.markPaid(id);
  }

  @Patch(':id/pay')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Manager, Role.Admin)
  @ApiOperation({ summary: 'Mark a maintenance payment as paid' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Maintenance payment marked paid' })
  @ApiResponse({ status: 404, description: 'Maintenance payment not found' })
  pay(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.markPaid(id);
  }

  @Post('settle-fee')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Remit/settle platform fee by manager' })
  @ApiResponse({ status: 200, description: 'Platform fee settled successfully' })
  settleFeePost(@Headers('x-user-id') userId: string, @Body() dto: SettleFeeDto) {
    return this.maintenanceService.settlePlatformFee(dto, this.optionalUserId(userId));
  }

  @Patch('settle-fee')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Remit/settle platform fee by manager (PATCH)' })
  @ApiResponse({ status: 200, description: 'Platform fee settled successfully' })
  settleFeePatch(@Headers('x-user-id') userId: string, @Body() dto: SettleFeeDto) {
    return this.maintenanceService.settlePlatformFee(dto, this.optionalUserId(userId));
  }

  @Post(':id/settle-fee')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Settle platform fee for a specific payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Platform fee settled' })
  settleSingleFee(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.settlePlatformFee({ paymentId: id });
  }

  @Get('owner/:ownerId/summary')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Manager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Get maintenance payment summary for one owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns totalPaid, pendingCount, monthlyPaid and totalAmount',
  })
  summary(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.maintenanceService.getOwnerSummary(ownerId);
  }

  @Delete(':id')
  @Roles(Role.MaintenanceManager, Role.Manager, Role.Admin)
  @ApiOperation({ summary: 'Delete a maintenance payment record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Maintenance payment deleted' })
  @ApiResponse({ status: 404, description: 'Maintenance payment not found' })
  remove(@Headers('x-user-id') userId: string, @Param('id', ParseIntPipe) id: number) {
    const parsedUserId = this.optionalUserId(userId);
    return parsedUserId
      ? this.maintenanceService.removeForManager(parsedUserId, id)
      : this.maintenanceService.remove(id);
  }

  private optionalUserId(value?: string): number | undefined {
    if (!value) return undefined;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  }
}

