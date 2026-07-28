import { Injectable, ForbiddenException } from '@nestjs/common';
import { Permission } from '@repo/types';
import { MembershipResolver } from './resolvers/membership.resolver';
import { PermissionEvaluator } from './evaluators/permission.evaluator';
import { AuthorizationContext } from './resolvers/policy.resolver';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly membershipResolver: MembershipResolver,
    private readonly permissionEvaluator: PermissionEvaluator,
  ) {}

  async checkPermissions(
    context: AuthorizationContext,
    requiredPermissions: Permission[],
  ): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 1. Resolve Membership (ensures user is in org, otherwise throws NotFoundException)
    const membership = await this.membershipResolver.resolveMembership(
      context.userId,
      context.organizationId,
    );

    // 2. Evaluate Permissions against the Role
    const isAllowed = this.permissionEvaluator.evaluate(
      membership.role,
      requiredPermissions,
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action',
      );
    }

    return true;
  }
}
