import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplaintStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Assigned = 'assigned',
  EstimatingCost = 'estimating_cost',
  InProgress = 'in_progress',
  Completed = 'completed',
  Billed = 'billed',
  Paid = 'paid',
  Closed = 'closed',
  PaymentPending = 'payment_pending',
  Resolved = 'resolved',
}

export enum ComplaintCategory {
  Plumbing = 'Plumbing',
  Electrical = 'Electrical',
  HVAC = 'HVAC',
  Carpentry = 'Carpentry',
  Painting = 'Painting',
  Sanitation = 'Sanitation',
  Security = 'Security',
  Elevator = 'Elevator',
  General = 'General',
  Maintenance = 'Maintenance',
}

export enum ComplaintPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'Water Leakage in Block A' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Continuous water leakage in corridor causing wet floors.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.Plumbing })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiProperty({ enum: ComplaintPriority, example: ComplaintPriority.High })
  @IsEnum(ComplaintPriority)
  priority: ComplaintPriority;

  @ApiProperty({ example: 1, description: 'ID of the owner submitting the complaint' })
  @IsNumber()
  @Min(1)
  ownerId: number;

  @ApiPropertyOptional({ example: 5, description: 'ID of the maintenance manager. If omitted, it is selected from the owner block.' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  managerId?: number;

  @ApiPropertyOptional({ example: 'A-101', description: 'Deprecated: location is derived from the owner profile propertyUnit' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'base64-encoded-image-string' })
  @IsOptional()
  @IsString()
  photo?: string;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Duplicate complaint already filed' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: '2024-03-20', description: 'Deadline for the complaint' })
  @IsOptional()
  @IsString()
  deadline?: string;
}
