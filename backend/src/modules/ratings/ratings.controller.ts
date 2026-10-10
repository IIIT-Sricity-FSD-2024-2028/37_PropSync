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
import { CreateRatingDto } from './dto/rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description:
    'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get()
  @Roles(Role.MaintenanceManager, Role.Admin, Role.ServiceProvider, Role.Owner)
  @ApiOperation({ summary: 'Get all ratings' })
  @ApiQuery({ name: 'ownerId', type: Number, required: false })
  @ApiQuery({ name: 'complaintId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Ratings list' })
  findAll(
    @Query('ownerId') ownerId?: number,
    @Query('complaintId') complaintId?: number,
  ) {
    return this.ratingsService.findAll(
      ownerId ? +ownerId : undefined,
      complaintId ? +complaintId : undefined,
    );
  }

  @Get(':id')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.Owner, Role.ServiceProvider)
  @ApiOperation({ summary: 'Get rating by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rating details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.findById(id);
  }

  @Post()
  @Roles(Role.Owner)
  @ApiOperation({
    summary: 'Submit a rating for a completed complaint (Owner only)',
  })
  @ApiResponse({ status: 201, description: 'Rating submitted' })
  @ApiResponse({
    status: 400,
    description:
      'Already rated, owner mismatch, no assigned provider, or complaint is not closed enough to rate',
  })
  create(@Body() dto: CreateRatingDto) {
    return this.ratingsService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a rating (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.remove(id);
  }
}
