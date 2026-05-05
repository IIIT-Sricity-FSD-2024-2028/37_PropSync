import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Matches, Min } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({
    example: '2026-05',
    description: 'Maintenance charge month in YYYY-MM format',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month: string;

  @ApiProperty({ example: 2000, minimum: 1 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 5,
    description: 'Maintenance manager creating charges; owners are selected from this manager block',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  managerId?: number;
}
