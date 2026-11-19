/**
 * WITHUS Mobile Secure Browser PoC — Authentication & Session Types
 * Strictly aligned with WITHUS backend contracts (apps/api)
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null;
  isSuperAdmin?: boolean;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | string;
  joinedAt: string;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  role?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  organization: Organization | null;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface DelegatedSession {
  id: string;
  organizationId: string;
  permittedUsername: string;
  platform: string;
  integrationProvider?: string;
  platformId?: string;
  resourceName?: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  capabilities?: string[];
  secretName?: string;
  vaultName?: string;
  grantor?: {
    email: string;
    fullName?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: string;
}

