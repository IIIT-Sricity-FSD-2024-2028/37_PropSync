import {
  Body, BadRequestException, Controller, Delete, Get, Headers, Param,
  ParseIntPipe, Patch, Post, Query, Res, UseGuards, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, RolesGuard } from '../../common/guards/roles.guard';
import { ApproveEstimateDto, CreateEstimateDto } from './dto/estimate.dto';
import { EstimatesService } from './estimates.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { appConfig } from '../../config/app.config';

const estimateUploadPath = join(appConfig.uploadsPath, 'estimates');
const documentTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

@ApiTags('Service Estimates')
@ApiSecurity('role')
@UseGuards(RolesGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  @Roles(Role.MaintenanceManager, Role.Admin, Role.ServiceProvider)
  findAll(@Headers('role') role: string, @Headers('x-user-id') userId: string,
    @Query('complaintId') complaintId?: number) {
    return this.estimatesService.findVisible(role, Number(userId), complaintId ? +complaintId : undefined);
  }

  @Get('provider/:providerId')
  @Roles(Role.ServiceProvider, Role.MaintenanceManager, Role.Admin)
  findByProvider(@Param('providerId', ParseIntPipe) providerId: number,
    @Headers('role') role: string, @Headers('x-user-id') userId: string) {
    return this.estimatesService.findVisible(role, Number(userId)).filter(e => e.providerId === providerId);
  }

  @Get(':id')
  @Roles(Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  findOne(@Param('id', ParseIntPipe) id: number,
    @Headers('role') role: string, @Headers('x-user-id') userId: string) {
    const estimate = this.estimatesService.findById(id);
    this.estimatesService.assertAccess(estimate, role, Number(userId));
    return estimate;
  }

  @Get(':id/document')
  @Roles(Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  document(@Param('id', ParseIntPipe) id: number,
    @Headers('role') role: string, @Headers('x-user-id') userId: string,
    @Res() response: Response) {
    const estimate = this.findOne(id, role, userId);
    const filename = basename(estimate.documentUrl || '');
    const path = join(estimateUploadPath, filename);
    if (!filename || !existsSync(path)) throw new BadRequestException('Estimate document is unavailable');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.download(path, estimate.documentName || filename);
  }

  @Post()
  @Roles(Role.ServiceProvider)
  @UseInterceptors(FileInterceptor('document', {
    // Keep uploads in memory until DTO and business validation finish; failed
    // validation must never leave a public orphaned file on disk.
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const type = documentTypes[extname(file.originalname).toLowerCase()];
      if (!type || type !== file.mimetype) {
        return callback(new BadRequestException('Please upload a PDF, Word, or Excel document.'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({ summary: 'Accept complaint and submit estimate; also supports assigned legacy complaints' })
  create(@Body() dto: CreateEstimateDto, @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-id') userId: string) {
    if (!Number(userId) || (dto.providerId && dto.providerId !== Number(userId))) {
      throw new BadRequestException('A matching provider session is required');
    }
    dto.providerId = Number(userId);
    if (!file) throw new BadRequestException('An estimate document is required. Upload a PDF, Word, or Excel file.');
    const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const path = join(estimateUploadPath, filename);
    try {
      mkdirSync(estimateUploadPath, { recursive: true });
      writeFileSync(path, file.buffer);
      dto.documentName = file.originalname;
      // Download is served only through the role/identity checked document route.
      dto.documentUrl = `http://localhost:${appConfig.port}/uploads/estimates/${filename}`;
      return this.estimatesService.create(dto);
    } catch (error) {
      if (existsSync(path)) unlinkSync(path);
      throw error;
    }
  }

  @Patch(':id')
  @Roles(Role.ServiceProvider, Role.MaintenanceManager, Role.Admin, Role.SuperUser)
  @UseInterceptors(FileInterceptor('document', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const type = documentTypes[extname(file.originalname).toLowerCase()];
      if (!type || type !== file.mimetype) {
        return callback(new BadRequestException('Please upload a PDF, Word, or Excel document.'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({ summary: 'Update an estimate cost, notes, or uploaded document' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEstimateDto>,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('role') role: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (file) {
      const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
      const path = join(estimateUploadPath, filename);
      mkdirSync(estimateUploadPath, { recursive: true });
      writeFileSync(path, file.buffer);
      dto.documentName = file.originalname;
      dto.documentUrl = `http://localhost:${appConfig.port}/uploads/estimates/${filename}`;
    }
    return this.estimatesService.update(id, dto, role, Number(userId));
  }

  @Patch(':id/review')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.SuperUser)
  @ApiOperation({ summary: 'Select provider and approve estimate, or reject this candidate only' })
  review(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveEstimateDto,
    @Headers('x-user-id') userId: string) {
    this.findOne(id, 'maintenance_manager', userId);
    return this.estimatesService.review(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.MaintenanceManager, Role.ServiceProvider, Role.SuperUser, Role.Owner)
  @ApiOperation({ summary: 'Delete an estimate' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('role') role: string,
    @Headers('x-user-id') userId: string,
  ) {
    const validUserId = Number(userId) > 0 ? Number(userId) : undefined;
    return this.estimatesService.remove(id, role, validUserId);
  }
}
