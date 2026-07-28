export enum Permission {
  // Organization
  ORGANIZATION_READ = "organization.read",
  ORGANIZATION_UPDATE = "organization.update",
  ORGANIZATION_DELETE = "organization.delete",

  // Members
  MEMBER_READ = "member.read",
  MEMBER_INVITE = "member.invite",
  MEMBER_REMOVE = "member.remove",
  MEMBER_UPDATE_ROLE = "member.update_role",

  // Vaults (Phase 4)
  VAULT_READ = "vault.read",
  VAULT_CREATE = "vault.create",
  VAULT_UPDATE = "vault.update",
  VAULT_DELETE = "vault.delete",

  // Applications (Phase 5)
  APPLICATION_READ = "application.read",
  APPLICATION_CREATE = "application.create",
  APPLICATION_UPDATE = "application.update",
  APPLICATION_DELETE = "application.delete",

  // Approvals (Phase 8)
  APPROVAL_READ = "approval.read",
  APPROVAL_APPROVE = "approval.approve",
  APPROVAL_REJECT = "approval.reject",

  // Sessions (Phase 6)
  SESSION_START = "session.start",
  SESSION_REVOKE = "session.revoke",
}
