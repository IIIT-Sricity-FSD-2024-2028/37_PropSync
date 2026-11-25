import { IsBoolean, IsNumber, IsOptional, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEstimateDto {
  @ApiProperty({ example: 1, description: 'Complaint/assignment ID this estimate is for' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  complaintId: number;

  @ApiPropertyOptional({ example: 4, description: 'Optional compatibility field; must match x-user-id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  providerId: number;

  @ApiProperty({ example: 3500.00, description: 'Estimated cost in INR (max 50,000)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(50000)
  estimatedCost: number;

  @ApiPropertyOptional({ example: 'Includes parts + labour for pipe replacement' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiPropertyOptional({ description: 'Public URL of the uploaded estimate document' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Original filename of the uploaded estimate document' })
  @IsOptional()
  @IsString()
  documentName?: string;
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
