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

  // Secrets (Phase 4)
  SECRET_CREATE = "secret.create",
  SECRET_READ = "secret.read",
  SECRET_UPDATE = "secret.update",
  SECRET_DELETE = "secret.delete",
  SECRET_REVEAL = "secret.reveal",

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

  // Integrations (Release D)
  INTEGRATION_READ = "integration.read",
  INTEGRATION_CONNECT = "integration.connect",
  INTEGRATION_DISCONNECT = "integration.disconnect",
}
