import {
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  resourceId?: string;
  resourceType?: string;
}

@Injectable()
export class PolicyResolver {
  resolveContext(context: ExecutionContext): AuthorizationContext {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new BadRequestException(
        'User not authenticated for policy resolution',
      );
    }

    // In most REST APIs, the organization ID is in the route parameter (e.g. /organizations/:id)
    // or passed via a header for global context.
    // Here we'll look for `id` or `organizationId` in params, then body.
    const organizationId =
      request.params?.organizationId ||
      request.params?.id ||
      request.body?.organizationId;

    if (!organizationId) {
      throw new BadRequestException(
        'Organization context is required for this action',
      );
    }

    return {
      userId,
      organizationId,
      // Future: extract resource specific info if needed
    };
  }
}
