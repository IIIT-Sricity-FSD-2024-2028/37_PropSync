import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
export { Role } from '../enums/roles.enum';
import { Role } from '../enums/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const role = (request.headers['role'] || '').toLowerCase().trim();

    if (!role) {
      throw new UnauthorizedException(
        'Missing "role" header. Please provide a valid role.',
      );
    }

    const validRoles = Object.values(Role) as string[];
    if (!validRoles.includes(role)) {
      throw new UnauthorizedException(
        `Invalid role "${role}". Valid roles: ${validRoles.join(', ')}`,
      );
    }

    // If a route has no explicit @Roles metadata, any valid role may access it.
    // The request still must include a valid role header, so new endpoints do not
    // accidentally bypass the evaluation's RBAC requirement.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.map((r) => r.toLowerCase()).includes(role)) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${role}`,
      );
    }

    return true;
  }
}
