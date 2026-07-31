import { IntegrationProvider } from '@prisma/client';

// ─── Connection Status ────────────────────────────────────────────────────────

export interface HealthCheckResult {
  healthy: boolean;
  /** Human-readable label (e.g. "Connected as john@acme.com") */
  identity?: string;
  error?: string;
  checkedAt: Date;
}

// ─── Core Adapter Contract ────────────────────────────────────────────────────

/**
 * Every integration provider must implement this interface.
 * Business logic (auth, RBAC, sessions, audit) lives in WITHUS services.
 * The adapter is only responsible for communicating with the external platform.
 */
export interface IIntegrationAdapter {
  readonly provider: IntegrationProvider;

  /**
   * Validate that the supplied PAT is accepted by the provider.
   * Returns the account identity on success, throws on failure.
   */
  validateToken(token: string): Promise<{ identity: string; meta?: Record<string, unknown> }>;

  /**
   * Ping the provider API and confirm the stored token is still valid.
   */
  healthCheck(token: string): Promise<HealthCheckResult>;

  /**
   * List resources the integration can act on (e.g. Vercel teams, GitHub orgs).
   * Returns a provider-specific list; callers should not depend on the shape.
   */
  listResources(token: string): Promise<IntegrationResource[]>;

  /**
   * Grant access to a resource for a specified principal (email/username).
   * Returns a provider-specific reference ID so the grant can be tracked.
   */
  grantAccess(token: string, input: GrantAccessInput): Promise<GrantAccessResult>;

  /**
   * Revoke previously granted access.
   */
  revokeAccess(token: string, input: RevokeAccessInput): Promise<void>;
}

// ─── Shared DTOs ─────────────────────────────────────────────────────────────

export interface IntegrationResource {
  id: string;
  name: string;
  url?: string;
  type: 'TEAM' | 'ORGANIZATION' | 'REPOSITORY' | 'PROJECT' | 'ACCOUNT';
}

export interface GrantAccessInput {
  resourceId: string;
  principalEmail: string;
  role?: string;
}

export interface GrantAccessResult {
  referenceId: string;
  status: 'PENDING_INVITE' | 'ACTIVE' | 'UNKNOWN';
  meta?: Record<string, unknown>;
}

export interface RevokeAccessInput {
  resourceId: string;
  principalEmail: string;
  referenceId?: string;
}
