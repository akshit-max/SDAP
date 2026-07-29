import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Permission } from '@repo/types';
import { AuthorizationService } from '../authorization.service';
import { PolicyResolver } from '../resolvers/policy.resolver';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
    private policyResolver: PolicyResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    // 1. Determine Context
    const authContext = this.policyResolver.resolveContext(context);

    // 2. Authorize
    return this.authorizationService.checkPermissions(
      authContext,
      requiredPermissions,
    );
  }
}
