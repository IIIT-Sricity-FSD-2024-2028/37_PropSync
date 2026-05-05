import { Controller, Get } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from './common/guards/roles.guard';

@ApiTags('Health')
@ApiSecurity('role')
@ApiHeader({
  name: 'role',
  description:
    'User role: owner | maintenance_manager | service_provider | admin',
  required: true,
})
@Controller()
export class AppController {
  @Get()
  @Roles(Role.Owner, Role.MaintenanceManager, Role.ServiceProvider, Role.Admin)
  @ApiOperation({ summary: 'API health check' })
  @ApiResponse({ status: 200, description: 'API is running' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  getInfo() {
    return {
      name: 'PropSync API',
      version: '1.0.0',
      description: 'Property Management & Service Coordination System',
      docs: 'http://localhost:3000/api/docs',
      status: 'running',
      timestamp: new Date().toISOString(),
      modules: [
        'users',
        'complaints',
        'estimates',
        'bills',
        'payments',
        'maintenance',
        'notifications',
        'ratings',
      ],
    };
  }
}
