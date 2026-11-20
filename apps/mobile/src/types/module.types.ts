/**
 * WITHUS Mobile Application — Core Module Types
 * Strictly aligned with WITHUS backend schemas and contracts
 */

export type NavigationModule =
  | 'DASHBOARD'
  | 'VAULTS'
  | 'SESSIONS'
  | 'ACTIVITY'
  | 'APPROVALS'
  | 'AUDIT'
  | 'INTEGRATIONS'
  | 'TEAM'
  | 'SETTINGS';

export interface VaultResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  secretsCount?: number;
  _count?: {
    secrets: number;
  };
}

export interface SecretMetadata {
  id: string;
  vaultId: string;
  name: string;
  description?: string | null;
  type?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  requesterId: string;
  requester?: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  platformId?: string | null;
  resourceName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PresenceRecord {
  userId: string;
  user?: {
    fullName: string | null;
    email: string;
  };
  platform: string;
  lastSeenAt: string;
  isActive: boolean;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorId?: string | null;
  actor?: {
    id: string;
    email: string;
    fullName?: string | null;
  } | null;
  action: string;
  resourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface IntegrationConnection {
  id: string | null;
  provider: string;
  status: 'ACTIVE' | 'DISCONNECTED' | 'ERROR';
  providerMeta?: Record<string, any> | null;
  lastCheckedAt?: string | null;
  lastError?: string | null;
  createdAt?: string | null;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
}

