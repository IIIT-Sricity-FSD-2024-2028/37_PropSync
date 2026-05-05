import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ example: 1, description: 'Owner giving the rating (user ID)' })
  @IsNumber()
  @Min(1)
  ownerId: number;

  @ApiProperty({ example: 6, description: 'Complaint that was resolved' })
  @IsNumber()
  @Min(1)
  complaintId: number;

  @ApiProperty({ example: 5, description: 'Rating score from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiPropertyOptional({ example: 'Excellent service, resolved quickly and professionally.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
