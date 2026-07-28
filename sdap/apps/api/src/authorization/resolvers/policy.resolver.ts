import {
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORGANIZATION_CONTEXT_KEY } from '../decorators/organization-context.decorator';

export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Resolves the authorization context from an incoming request.
 *
 * Resolution order for organizationId:
 * 1. The route parameter declared by @OrganizationContext('paramName') decorator.
 * 2. Falls back to `request.body.organizationId` as a last resort.
 *
 * Critically: does NOT assume `params.id` is always an organization ID.
 * This is safe for future routes where `:id` may refer to a Vault, Secret, etc.
 */
@Injectable()
export class PolicyResolver {
  constructor(private readonly reflector: Reflector) {}

  resolveContext(context: ExecutionContext): AuthorizationContext {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new BadRequestException(
        'User not authenticated for policy resolution',
      );
    }

    // 1. Look for explicitly declared organization context via decorator
    const declaredParam = this.reflector.getAllAndOverride<string>(
      ORGANIZATION_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
    );

    let organizationId: string | undefined;

    if (declaredParam) {
      organizationId = request.params?.[declaredParam];
    }

    // 2. Fallback: check body for organizationId (e.g., POST without route param)
    if (!organizationId) {
      organizationId = request.body?.organizationId;
    }

    if (!organizationId) {
      throw new BadRequestException(
        'Organization context is required for this action. ' +
          'Ensure the route declares @OrganizationContext() or passes organizationId in the body.',
      );
    }

    return {
      userId,
      organizationId,
    };
  }
}
