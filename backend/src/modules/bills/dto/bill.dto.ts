import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBillDto {
  @ApiProperty({ example: 6, description: 'Complaint ID for this bill' })
  @IsNumber()
  @Min(1)
  complaintId: number;

  @ApiProperty({ example: 2800.00, description: 'Base amount in INR' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Penalty for delayed completion (default 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;

  @ApiPropertyOptional({ example: 'Bill for electrical rewiring work' })
  @IsOptional()
  @IsString()
  description?: string;
}
