import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 2, description: 'Bill ID being paid' })
  @IsNumber()
  @Min(1)
  billId: number;

  @ApiProperty({ example: 1, description: 'Owner (payer) user ID' })
  @IsNumber()
  @Min(1)
  ownerId: number;

  @ApiProperty({ example: 4700.00, description: 'Amount paid in INR' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'base64-encoded-receipt-image' })
  @IsOptional()
  @IsString()
  receiptImage?: string;
}
