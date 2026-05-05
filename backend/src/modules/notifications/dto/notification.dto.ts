import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  ComplaintSubmitted = 'complaint_submitted',
  ComplaintApproved = 'complaint_approved',
  ComplaintRejected = 'complaint_rejected',
  ProviderAssigned = 'provider_assigned',
  EstimateSubmitted = 'estimate_submitted',
  EstimateApproved = 'estimate_approved',
  WorkCompleted = 'work_completed',
  PaymentDue = 'payment_due',
  Overdue = 'overdue',
  Custom = 'custom',
}

export enum NotificationRecipient {
  All = 'all',
  Owner = 'owner',
  ServiceProvider = 'service_provider',
  MaintenanceManager = 'maintenance_manager',
  Admin = 'admin',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User ID to notify' })
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiPropertyOptional({ example: 3, description: 'Related complaint ID (optional)' })
  @IsOptional()
  @IsNumber()
  complaintId?: number;

  @ApiPropertyOptional({ example: 11, description: 'Related user ID for signup approval notifications' })
  @IsOptional()
  @IsNumber()
  relatedUserId?: number;

  @ApiProperty({ example: 'Your complaint has been approved.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ComplaintApproved })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationRecipient, example: NotificationRecipient.Owner })
  @IsEnum(NotificationRecipient)
  recipient: NotificationRecipient;
}
