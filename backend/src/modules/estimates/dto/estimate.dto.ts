import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEstimateDto {
  @ApiProperty({ example: 1, description: 'Complaint/assignment ID this estimate is for' })
  @IsNumber()
  @Min(1)
  complaintId: number;

  @ApiProperty({ example: 4, description: 'Service provider user ID' })
  @IsNumber()
  @Min(1)
  providerId: number;

  @ApiProperty({ example: 3500.00, description: 'Estimated cost in INR' })
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiPropertyOptional({ example: 'Includes parts + labour for pipe replacement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveEstimateDto {
  @ApiProperty({ example: true, description: 'true = approved, false = rejected' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ example: 'Cost is too high, please revise' })
  @IsOptional()
  @IsString()
  managerNote?: string;
}
