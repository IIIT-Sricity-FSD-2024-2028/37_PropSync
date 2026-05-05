import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role, RolesGuard } from './roles.guard';

function mockContext(role?: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: role ? { role } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('requires a role header even when a route has no explicit role metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(() => guard.canActivate(mockContext())).toThrow(
      'Missing "role" header',
    );
  });

  it('allows an unannotated route when the request has any valid role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext(Role.Owner))).toBe(true);
  });

  it('rejects a valid role that is not allowed for the route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    expect(() => guard.canActivate(mockContext(Role.Owner))).toThrow(
      'Access denied',
    );
  });

  it('allows a valid role that is listed on the route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    expect(guard.canActivate(mockContext(Role.Admin))).toBe(true);
  });
});
