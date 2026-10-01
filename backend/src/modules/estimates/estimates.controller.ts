import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { appConfig } from '../../config/app.config';

const estimateUploadPath = join(process.cwd(), 'uploads', 'estimates');

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
  @UseInterceptors(FileInterceptor('document', {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        try { if (!existsSync(estimateUploadPath)) mkdirSync(estimateUploadPath, { recursive: true }); callback(null, estimateUploadPath); }
        catch (error) { callback(error as Error, estimateUploadPath); }
      },
      filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => callback(null, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.mimetype)),
  }))
  @ApiOperation({ summary: 'Submit a cost estimate (Service Provider only)' })
  @ApiResponse({ status: 201, description: 'Estimate submitted' })
  @ApiResponse({ status: 400, description: 'Duplicate or validation error' })
  create(@Body() dto: CreateEstimateDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('An estimate document is required. Upload a PDF, Word, or Excel file.');
    }
    if (file) {
      dto.documentName = file.originalname;
      dto.documentUrl = `http://localhost:${appConfig.port}/uploads/estimates/${file.filename}`;
    }
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
