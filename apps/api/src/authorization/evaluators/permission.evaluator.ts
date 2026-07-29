import { Injectable } from '@nestjs/common';
import { Permission } from '@repo/types';

@Injectable()
export class PermissionEvaluator {
  // Hardcoded policy matrix for now.
  // In the future, this can be fetched from the database for custom roles.
  private readonly rolePermissions: Record<string, Permission[]> = {
    OWNER: [
      Permission.ORGANIZATION_READ,
      Permission.ORGANIZATION_UPDATE,
      Permission.ORGANIZATION_DELETE,
      Permission.MEMBER_READ,
      Permission.MEMBER_INVITE,
      Permission.MEMBER_REMOVE,
      Permission.MEMBER_UPDATE_ROLE,
      Permission.VAULT_READ,
      Permission.VAULT_CREATE,
      Permission.VAULT_UPDATE,
      Permission.VAULT_DELETE,
      Permission.APPLICATION_READ,
      Permission.APPLICATION_CREATE,
      Permission.APPLICATION_UPDATE,
      Permission.APPLICATION_DELETE,
      Permission.APPROVAL_READ,
      Permission.APPROVAL_APPROVE,
      Permission.APPROVAL_REJECT,
      Permission.SESSION_START,
      Permission.SESSION_REVOKE,
    ],
    ADMIN: [
      Permission.ORGANIZATION_READ,
      Permission.MEMBER_READ,
      Permission.MEMBER_INVITE,
      Permission.MEMBER_REMOVE,
      Permission.VAULT_READ,
      Permission.VAULT_CREATE,
      Permission.APPLICATION_READ,
      Permission.APPLICATION_CREATE,
      Permission.APPROVAL_READ,
      Permission.APPROVAL_APPROVE,
      Permission.SESSION_START,
      Permission.SESSION_REVOKE,
    ],
    MEMBER: [
      Permission.ORGANIZATION_READ,
      Permission.MEMBER_READ,
      Permission.VAULT_READ,
      Permission.APPLICATION_READ,
      Permission.APPROVAL_READ,
      Permission.SESSION_START,
    ],
  };

  evaluate(role: string, requiredPermissions: Permission[]): boolean {
    const userPermissions = this.rolePermissions[role] || [];

    // Check if user has ALL required permissions
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
