import { SetMetadata } from '@nestjs/common';

export const ORGANIZATION_CONTEXT_KEY = 'organizationContext';

/**
 * Declares the route parameter that holds the organization ID.
 * Use this on any endpoint that requires organization-scoped authorization.
 *
 * @example @OrganizationContext('id')         // /organizations/:id
 * @example @OrganizationContext('orgId')      // /vaults/:orgId/secrets/:id
 */
export const OrganizationContext = (paramName: string) =>
  SetMetadata(ORGANIZATION_CONTEXT_KEY, paramName);
