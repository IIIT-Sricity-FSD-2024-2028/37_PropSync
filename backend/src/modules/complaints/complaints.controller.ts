import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
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
import { appConfig } from '../../config/app.config';

import {
  ComplaintStatus,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

import { ComplaintsService } from './complaints.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';


// ======================================================
// FILE UPLOAD DIRECTORY
// ======================================================

const uploadPath = join(
  process.cwd(),
  'uploads',
  'complaints',
);

if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}


// ======================================================
// CONTROLLER
// ======================================================

@ApiTags('Complaints')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description:
    'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@UseGuards(RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
  ) {}


  // ======================================================
  // GET ALL COMPLAINTS
  // ======================================================

  @Get()
  @Roles(
    Role.Owner,
    Role.MaintenanceManager,
    Role.Admin,
    Role.ServiceProvider,
    Role.SuperUser,
  )
  @ApiOperation({
    summary: 'Get all complaints with optional filters',
  })
  @ApiQuery({
    name: 'status',
    enum: ComplaintStatus,
    required: false,
  })
  @ApiQuery({
    name: 'ownerId',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'managerId',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'availableForProviderId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of complaints',
  })
  findAll(
    @Query('status') status?: ComplaintStatus,
    @Query('ownerId') ownerId?: number,
    @Query('managerId') managerId?: number,
    @Query('availableForProviderId') availableForProviderId?: number,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('role') roleHeader?: string,
  ) {
    return this.complaintsService.findAll(
      status,
      ownerId ? +ownerId : undefined,
      managerId ? +managerId : undefined,
      availableForProviderId ? +availableForProviderId : undefined,
      {
        role: roleHeader?.toLowerCase().trim(),
        id: userIdHeader ? +userIdHeader : undefined,
      },
    );
  }


  // ======================================================
  // DASHBOARD STATS
  // ======================================================

  @Get('stats')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.SuperUser)
  @ApiOperation({
    summary: 'Dashboard stats for manager/admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Complaint statistics',
  })
  getStats() {
    return this.complaintsService.getDashboardStats();
  }


  // ======================================================
  // PENDING COMPLAINTS
  // ======================================================

  @Get('pending')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.SuperUser)
  @ApiOperation({
    summary: 'Get all pending complaints awaiting review',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending complaints list',
  })
  getPending() {
    return this.complaintsService.findPending();
  }


  // ======================================================
  // COMPLAINTS BY OWNER
  // ======================================================

  @Get('owner/:ownerId')
  @Roles(
    Role.Owner,
    Role.MaintenanceManager,
    Role.Admin,
    Role.SuperUser,
  )
  @ApiOperation({
    summary: 'Get all complaints by a specific owner',
  })
  @ApiParam({
    name: 'ownerId',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complaints for the owner',
  })
  findByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ) {
    return this.complaintsService.findByOwner(ownerId);
  }


  // ======================================================
  // COMPLAINTS BY MANAGER
  // ======================================================

  @Get('manager/:managerId')
  @Roles(Role.MaintenanceManager, Role.Admin, Role.SuperUser)
  @ApiOperation({
    summary:
      'Get all complaints assigned to a maintenance manager',
  })
  @ApiParam({
    name: 'managerId',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complaints for the manager',
  })
  findByManager(
    @Param('managerId', ParseIntPipe) managerId: number,
  ) {
    return this.complaintsService.findByManager(managerId);
  }


  // ======================================================
  // COMPLAINTS BY PROVIDER
  // ======================================================

  @Get('provider/:providerId')
  @Roles(
    Role.ServiceProvider,
    Role.MaintenanceManager,
    Role.Admin,
    Role.SuperUser,
  )
  @ApiOperation({
    summary:
      'Get complaints assigned to a service provider',
  })
  @ApiParam({
    name: 'providerId',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Assigned complaints for provider',
  })
  findByProvider(
    @Param('providerId', ParseIntPipe) providerId: number,
  ) {
    return this.complaintsService.findByProvider(providerId);
  }


  // ======================================================
  // GET COMPLAINT BY ID
  // ======================================================

  @Get(':id')
  @Roles(
    Role.Owner,
    Role.MaintenanceManager,
    Role.ServiceProvider,
    Role.Admin,
    Role.SuperUser,
  )
  @ApiOperation({
    summary: 'Get a complaint by ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complaint details',
  })
  @ApiResponse({
    status: 404,
    description: 'Complaint not found',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('role') roleHeader?: string,
  ) {
    return this.complaintsService.findById(id, {
      role: roleHeader?.toLowerCase().trim(),
      id: userIdHeader ? +userIdHeader : undefined,
    });
  }


  // ======================================================
  // CREATE COMPLAINT + FILE UPLOAD
  // ======================================================

  @Post()
  @Roles(Role.Owner)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (
          _req,
          _file,
          callback,
        ) => {
          try {
            // The directory can be removed while the server is running, so
            // ensure it exists at the point Multer writes the uploaded file.
            mkdirSync(uploadPath, { recursive: true });
            callback(null, uploadPath);
          } catch (error) {
            callback(error as Error, uploadPath);
          }
        },

        filename: (
          _req,
          file,
          callback,
        ) => {
          const uniqueName =
            `${Date.now()}-${Math.round(
              Math.random() * 1e9,
            )}${extname(file.originalname)}`;

          callback(null, uniqueName);
        },
      }),

      // Maximum file size = 5 MB
      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      // Allowed file types
      fileFilter: (
        _req,
        file,
        callback,
      ) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Only JPG, PNG and WEBP images are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({
    summary:
      'Submit a new complaint with optional photo',
  })
  @ApiResponse({
    status: 201,
    description:
      'Complaint submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation or file upload error',
  })
  create(
    @Body() dto: CreateComplaintDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If a photo was uploaded,
    // store its public API URL. A relative /uploads URL would otherwise be
    // resolved against the frontend server instead of the NestJS server.
    if (file) {
      dto.photo =
        `http://localhost:${appConfig.port}/uploads/complaints/${file.filename}`;
    }

    return this.complaintsService.create(dto);
  }


  // ======================================================
  // UPDATE COMPLAINT STATUS
  // ======================================================

  @Patch(':id/status')
  @Roles(
    Role.MaintenanceManager,
    Role.Admin,
    Role.ServiceProvider,
  )
  @ApiOperation({
    summary:
      'Update complaint status (Manager/Admin/SP)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description:
      'Complaint not found',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
    @Headers('role') role: string,
  ) {
    return this.complaintsService.updateStatus(
      id,
      dto,
      role,
    );
  }


  // ======================================================
  // ASSIGN PROVIDER
  // ======================================================

  @Patch(':id/assign/:providerId')
  @Roles(Role.MaintenanceManager)
  @ApiOperation({
    summary:
      'Assign an approved complaint to a service provider',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Complaint ID',
  })
  @ApiParam({
    name: 'providerId',
    type: Number,
    description:
      'Provider user ID',
  })
  @ApiResponse({
    status: 200,
    description:
      'Provider assigned successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Complaint not in Approved state',
  })
  assignProvider(
    @Param('id', ParseIntPipe) id: number,
    @Param('providerId', ParseIntPipe)
      providerId: number,
  ) {
    return this.complaintsService.assignProvider(
      id,
      providerId,
    );
  }


  // ======================================================
  // PROVIDER INTEREST QUEUE
  // ======================================================

  @Get(':id/queue')
  @Roles(
    Role.MaintenanceManager,
    Role.Admin,
  )
  @ApiOperation({
    summary:
      'Get the list of providers who expressed interest in an approved complaint (Manager/Admin)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Complaint ID',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns complaintId and queue (array of provider IDs)',
  })
  @ApiResponse({
    status: 404,
    description:
      'Complaint not found',
  })
  getQueue(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.complaintsService.getInterestedProviders(
      id,
    );
  }


  // ======================================================
  // SERVICE PROVIDER INTEREST
  // ======================================================

  @Patch(':id/sp-interest')
  @Roles(Role.ServiceProvider)
  @ApiOperation({
    summary:
      'Service Provider expresses interest in an approved complaint — joins the queue',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Provider added to the interest queue. Returns updated queue.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Complaint not approved or invalid provider',
  })
  spInterest(
    @Param('id', ParseIntPipe) id: number,
    @Body('providerId') providerId?: number,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('provider-id') headerProviderId?: string,
  ) {
    const pId =
      providerId ||
      (headerUserId ? parseInt(headerUserId, 10) : undefined) ||
      (headerProviderId ? parseInt(headerProviderId, 10) : undefined);

    if (!pId) {
      throw new BadRequestException('providerId is required');
    }

    return this.complaintsService.spExpressInterest(
      id,
      pId,
    );
  }


  // ======================================================
  // SERVICE PROVIDER ACCEPT
  // ======================================================

  @Patch(':id/sp-accept')
  @Roles(Role.ServiceProvider)
  @ApiOperation({
    summary:
      '[Deprecated alias] Same as sp-interest — kept for backward compatibility',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Provider added to interest queue',
  })
  spAccept(
    @Param('id', ParseIntPipe) id: number,
    @Body('providerId') providerId?: number,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('provider-id') headerProviderId?: string,
  ) {
    const pId =
      providerId ||
      (headerUserId ? parseInt(headerUserId, 10) : undefined) ||
      (headerProviderId ? parseInt(headerProviderId, 10) : undefined);

    return this.complaintsService.spAcceptAssignment(
      id,
      pId,
    );
  }


  // ======================================================
  // SERVICE PROVIDER REJECT
  // ======================================================

  @Patch(':id/sp-reject')
  @Roles(Role.ServiceProvider)
  @ApiOperation({
    summary:
      'Service Provider rejects assigned complaint or declines interest',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description:
      'Complaint rejected or declined by SP',
  })
  spReject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
    @Body('providerId') providerId?: number,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('provider-id') headerProviderId?: string,
  ) {
    const pId =
      providerId ||
      (headerUserId ? parseInt(headerUserId, 10) : undefined) ||
      (headerProviderId ? parseInt(headerProviderId, 10) : undefined);

    return this.complaintsService.spReject(
      id,
      pId,
      reason,
    );
  }


  // ======================================================
  // DELETE COMPLAINT
  // ======================================================

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a complaint (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complaint deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Complaint not found',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.complaintsService.remove(id);
  }
}
