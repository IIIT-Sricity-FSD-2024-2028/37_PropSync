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
import { CreateMaintenanceDto } from './dto/maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance Payments')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role for this module: owner | manager',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('create')
  @Roles(Role.Manager)
  @ApiOperation({ summary: 'Create monthly maintenance charges for owners in the manager block' })
  @ApiResponse({ status: 201, description: 'Charges created for owners in the manager block' })
  @ApiResponse({ status: 409, description: 'A charge already exists for the month' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.createMonthlyCharges(dto);
  }

  @Get()
  @Roles(Role.Manager)
  @ApiOperation({ summary: 'Get all maintenance payments for manager view' })
  @ApiQuery({ name: 'managerId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Maintenance payment list' })
  findAll(@Query('managerId') managerId?: number) {
    return this.maintenanceService.findAll(managerId ? +managerId : undefined);
  }

  @Get('owner/:ownerId')
  @Roles(Role.Owner)
  @ApiOperation({ summary: 'Get maintenance payments for one owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Owner maintenance payment history' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.maintenanceService.findByOwner(ownerId);
  }

  @Patch(':id/pay')
  @Roles(Role.Owner)
  @ApiOperation({ summary: 'Mark a maintenance payment as paid by owner' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Maintenance payment marked paid' })
  @ApiResponse({ status: 404, description: 'Maintenance payment not found' })
  pay(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.markPaid(id);
  }

  @Get('owner/:ownerId/summary')
  @Roles(Role.Owner)
  @ApiOperation({ summary: 'Get maintenance payment summary for one owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns totalPaid, pendingCount and monthlyPaid',
  })
  summary(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.maintenanceService.getOwnerSummary(ownerId);
  }

  @Delete(':id')
  @Roles(Role.Manager)
  @ApiOperation({ summary: 'Delete a maintenance payment record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Maintenance payment deleted' })
  @ApiResponse({ status: 404, description: 'Maintenance payment not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.remove(id);
  }
}
