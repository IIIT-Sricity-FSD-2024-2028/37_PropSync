import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const roleHeader = request.headers['role'];

    if (!roleHeader) {
      throw new BadRequestException(
        'Missing "role" header. Please pass your role in the request header. ' +
          'Valid roles: owner, maintenance_manager, service_provider, administrator, super_user',
      );
    }

    const normalizedRole = roleHeader.toLowerCase().trim();
    const validRoles = Object.values(Role);

    if (!validRoles.includes(normalizedRole as Role)) {
      throw new BadRequestException(
        `Invalid role "${roleHeader}". Valid roles are: ${validRoles.join(', ')}`,
      );
    }

    // Attach role to request for use in controllers
    request.userRole = normalizedRole;

    const hasRole = requiredRoles.some((role) => role === normalizedRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. This endpoint requires one of: [${requiredRoles.join(', ')}]. ` +
          `Your role "${normalizedRole}" is not authorized.`,
      );
    }

    return true;
  }
}
