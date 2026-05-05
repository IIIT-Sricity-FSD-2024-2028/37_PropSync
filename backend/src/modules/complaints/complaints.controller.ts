import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import {
  ComplaintStatus,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';
import { ComplaintsService } from './complaints.service';

@ApiTags('Complaints')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Admin, Role.ServiceProvider)
  @ApiOperation({ summary: 'Get all complaints with optional filters' })
  @ApiQuery({ name: 'status', enum: ComplaintStatus, required: false })
  @ApiQuery({ name: 'ownerId', type: Number, required: false })
  @ApiQuery({ name: 'managerId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of complaints' })
  findAll(
    @Query('status') status?: ComplaintStatus,
    @Query('ownerId') ownerId?: number,
    @Query('managerId') managerId?: number,
  ) {
    return this.complaintsService.findAll(
      status,
      ownerId ? +ownerId : undefined,
      managerId ? +managerId : undefined,
    );
  }

  @Get('stats')
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Dashboard stats for manager/admin' })
  @ApiResponse({ status: 200, description: 'Complaint statistics' })
  getStats() {
    return this.complaintsService.getDashboardStats();
  }

  @Get('pending')
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get all pending complaints awaiting review' })
  @ApiResponse({ status: 200, description: 'Pending complaints list' })
  getPending() {
    return this.complaintsService.findPending();
  }

  @Get('owner/:ownerId')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get all complaints by a specific owner' })
  @ApiParam({ name: 'ownerId', type: Number })
  @ApiResponse({ status: 200, description: 'Complaints for the owner' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.complaintsService.findByOwner(ownerId);
  }

  @Get('manager/:managerId')
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get all complaints assigned to a maintenance manager' })
  @ApiParam({ name: 'managerId', type: Number })
  @ApiResponse({ status: 200, description: 'Complaints for the manager' })
  findByManager(@Param('managerId', ParseIntPipe) managerId: number) {
    return this.complaintsService.findByManager(managerId);
  }

  @Get('provider/:providerId')
  @Roles(Role.ServiceProvider, Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get complaints assigned to a service provider' })
  @ApiParam({ name: 'providerId', type: Number })
  @ApiResponse({ status: 200, description: 'Assigned complaints for provider' })
  findByProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return this.complaintsService.findByProvider(providerId);
  }

  @Get(':id')
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Get a complaint by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Complaint details' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.findById(id);
  }

  @Post()
  @Roles(Role.Owner)
  @ApiOperation({ summary: 'Submit a new complaint (Owner only)' })
  @ApiResponse({ status: 201, description: 'Complaint submitted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.ServiceProvider)
  @ApiOperation({
    summary: 'Update complaint status (Manager/Admin/SP)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
    @Headers('role') role: string,
  ) {
    return this.complaintsService.updateStatus(id, dto, role);
  }

  @Patch(':id/assign/:providerId')
  @Roles(Role.MaintenanceManager)
  @ApiOperation({ summary: 'Assign an approved complaint to a service provider' })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiParam({ name: 'providerId', type: Number, description: 'Provider user ID' })
  @ApiResponse({ status: 200, description: 'Provider assigned successfully' })
  @ApiResponse({ status: 400, description: 'Complaint not in Approved state' })
  assignProvider(
    @Param('id', ParseIntPipe) id: number,
    @Param('providerId', ParseIntPipe) providerId: number,
  ) {
    return this.complaintsService.assignProvider(id, providerId);
  }

  @Get(':id/queue')
  @Roles(Role.MaintenanceManager, Role.Admin)
  @ApiOperation({
    summary: 'Get the list of providers who expressed interest in an approved complaint (Manager/Admin)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns complaintId and queue (array of provider IDs)',
  })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  getQueue(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.getInterestedProviders(id);
  }

  @Patch(':id/sp-interest')
  @Roles(Role.ServiceProvider)
  @ApiOperation({
    summary: 'Service Provider expresses interest in an approved complaint — joins the queue',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Complaint ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider added to the interest queue. Returns updated queue.',
  })
  @ApiResponse({ status: 400, description: 'Complaint not approved or provider already in queue' })
  spInterest(
    @Param('id', ParseIntPipe) id: number,
    @Body('providerId') providerId: number,
  ) {
    return this.complaintsService.spExpressInterest(id, providerId);
  }

  @Patch(':id/sp-accept')
  @Roles(Role.ServiceProvider)
  @ApiOperation({
    summary: '[Deprecated alias] Same as sp-interest — kept for backward compatibility',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Provider added to interest queue' })
  spAccept(
    @Param('id', ParseIntPipe) id: number,
    @Body('providerId') providerId?: number,
    @Headers('provider-id') headerProviderId?: string,
  ) {
    const pId = providerId || (headerProviderId ? parseInt(headerProviderId, 10) : undefined);
    return this.complaintsService.spAcceptAssignment(id, pId);
  }

  @Patch(':id/sp-reject')
  @Roles(Role.ServiceProvider)
  @ApiOperation({ summary: 'Service Provider rejects their assigned complaint' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Complaint rejected by SP' })
  spReject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.complaintsService.spRejectAssignment(id, reason);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a complaint (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Complaint deleted' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.remove(id);
  }
}
