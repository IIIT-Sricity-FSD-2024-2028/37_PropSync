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
import { ApproveEstimateDto, CreateEstimateDto } from './dto/estimate.dto';
import { EstimatesService } from './estimates.service';

@ApiTags('Service Estimates')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description: 'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  @Roles(Role.MaintenanceManager, Role.Admin, Role.ServiceProvider)
  @ApiOperation({ summary: 'Get all service estimates' })
  @ApiQuery({ name: 'complaintId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of estimates' })
  findAll(@Query('complaintId') complaintId?: number) {
    return this.estimatesService.findAll(complaintId ? +complaintId : undefined);
  }

  @Get('provider/:providerId')
  @Roles(Role.ServiceProvider, Role.MaintenanceManager, Role.Admin)
  @ApiOperation({ summary: 'Get estimates submitted by a provider' })
  @ApiParam({ name: 'providerId', type: Number })
  @ApiResponse({ status: 200, description: 'Provider estimates' })
  findByProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return this.estimatesService.findByProvider(providerId);
  }

  @Get(':id')
  @Roles(Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'Get estimate by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estimate details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estimatesService.findById(id);
  }

  @Post()
  @Roles(Role.ServiceProvider)
  @ApiOperation({ summary: 'Submit a cost estimate (Service Provider only)' })
  @ApiResponse({ status: 201, description: 'Estimate submitted' })
  @ApiResponse({ status: 400, description: 'Duplicate or validation error' })
  create(@Body() dto: CreateEstimateDto) {
    return this.estimatesService.create(dto);
  }

  @Patch(':id/review')
  @Roles(Role.MaintenanceManager)
  @ApiOperation({ summary: 'Approve or reject a cost estimate (Manager only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estimate reviewed' })
  @ApiResponse({ status: 400, description: 'Already reviewed' })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveEstimateDto,
  ) {
    return this.estimatesService.review(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an estimate (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estimatesService.remove(id);
  }
}
