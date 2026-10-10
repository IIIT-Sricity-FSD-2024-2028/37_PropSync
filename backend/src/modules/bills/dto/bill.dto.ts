import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBillDto {
  @ApiProperty({ example: 6, description: 'Complaint ID for this bill' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  complaintId: number;

  @ApiProperty({ example: 2800.00, description: 'Base amount in INR' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Penalty for delayed completion (default 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  penalty?: number;

  @ApiPropertyOptional({ example: 'Bill for electrical rewiring work' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Public URLs of uploaded bill attachments' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Original filenames of uploaded bill attachments' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentNames?: string[];
}
