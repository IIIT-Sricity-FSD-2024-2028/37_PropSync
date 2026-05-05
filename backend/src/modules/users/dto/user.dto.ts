import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  Owner = 'owner',
  MaintenanceManager = 'maintenance_manager',
  ServiceProvider = 'service_provider',
  Admin = 'admin',
}

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.Owner })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'A-101', description: 'Required for Owner' })
  @IsOptional()
  @IsString()
  propertyUnit?: string;

  @ApiPropertyOptional({ example: 'Green Valley Society' })
  @IsOptional()
  @IsString()
  communityName?: string;

  @ApiPropertyOptional({ example: 'Electrical', description: 'Required for Service Provider' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Block handled by a Maintenance Manager' })
  @IsOptional()
  @IsString()
  block?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+91-9999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'B-202' })
  @IsOptional()
  @IsString()
  propertyUnit?: string;

  @ApiPropertyOptional({ example: 'Green Valley Society' })
  @IsOptional()
  @IsString()
  communityName?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  block?: string;
}
