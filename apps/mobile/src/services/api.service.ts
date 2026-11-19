/**
 * WITHUS Mobile Secure Browser PoC — Backend API Service
 *
 * Implements:
 * - Authentication (POST /api/v1/auth/login)
 * - Concurrency-safe Refresh Token Rotation (POST /api/v1/auth/refresh)
 * - Safe Logout (POST /api/v1/auth/logout)
 * - Explicit Organization Retrieval & Selection (GET /api/v1/organizations)
 * - Delegated Sessions Fetch (GET /api/v1/organizations/:orgId/sessions/incoming)
 * - Current User Profile (GET /api/v1/users/me)
 */

import { SecureStorageService } from './storage.service';
import {
  LoginResponse,
  RefreshResponse,
  UserProfile,
  Organization,
  DelegatedSession,
} from '../types/auth.types';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ApiService {
  // In-flight refresh promise mutex to completely prevent token-rotation race conditions
  private static refreshInProgressPromise: Promise<string> | null = null;

  /**
   * Helper to perform fetch with base URL and default JSON headers
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false,
  ): Promise<T> {
    const baseUrl = await SecureStorageService.getApiBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Extension-Client': 'withus-mv3',
      ...(options.headers as Record<string, string>),
    };

    if (requireAuth) {
      let accessToken = await SecureStorageService.getAccessToken();
      if (!accessToken) {
        accessToken = await this.refreshTokenSafely();
      }
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const fullUrl = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
    let response: Response;

    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
      });
    } catch (err: any) {
      throw new ApiError(
        `Network connection failed: ${err.message || 'Cannot reach server at ' + baseUrl}`,
        0,
      );
    }

    // Handle 401 Unauthorized with token refresh and retry (once)
    if (response.status === 401 && requireAuth) {
      try {
        const newAccessToken = await this.refreshTokenSafely();
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errData.message || `Request failed after refresh with status ${retryResponse.status}`,
            retryResponse.status,
          );
        }
        return (await retryResponse.json()) as T;
      } catch (refreshErr: any) {
        await SecureStorageService.clearAllAuthData();
        throw new ApiError(
          refreshErr.message || 'Session expired. Please log in again.',
          401,
        );
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message =
        errData.message ||
        (Array.isArray(errData.errors) ? errData.errors.join(', ') : `Request failed with status ${response.status}`);
      throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
  }

  /**
   * Concurrency-safe token refresh mutex.
   * Ensures only one POST /api/v1/auth/refresh is in-flight at any time,
   * preventing token family invalidation caused by rotation races.
   */
  static async refreshTokenSafely(): Promise<string> {
    if (this.refreshInProgressPromise) {
      return this.refreshInProgressPromise;
    }

    this.refreshInProgressPromise = (async () => {
      try {
        const storedRefreshToken = await SecureStorageService.getRefreshToken();
        if (!storedRefreshToken) {
          throw new ApiError('No refresh token available. Login required.', 401);
        }

        const baseUrl = await SecureStorageService.getApiBaseUrl();
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Extension-Client': 'withus-mv3',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new ApiError(
            errData.message || 'Refresh token expired or revoked',
            response.status,
          );
        }

        const data = (await response.json()) as RefreshResponse;

        // Persist rotated tokens immediately in Android Keystore
        await SecureStorageService.setAccessToken(data.accessToken);
        await SecureStorageService.setRefreshToken(data.refreshToken);
        if (data.user) {
          await SecureStorageService.setUserProfile(data.user);
        }

        return data.accessToken;
      } finally {
        this.refreshInProgressPromise = null;
      }
    })();

    return this.refreshInProgressPromise;
  }

  /**
   * Fetch all organizations the authenticated user belongs to.
   * (GET /api/v1/organizations)
   */
  static async getUserOrganizations(explicitToken?: string): Promise<Organization[]> {
    const headers: Record<string, string> = {};
    if (explicitToken) {
      headers['Authorization'] = `Bearer ${explicitToken}`;
    }

    try {
      const response = await this.request<{ success: boolean; data: Organization[] }>(
        'organizations',
        { method: 'GET', headers },
        !explicitToken,
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Login using WITHUS API (POST /api/v1/auth/login)
   *
   * Addresses Organization Selection (Verification Point A):
   * 1. Fetches full list of user organizations via GET /api/v1/organizations
   * 2. Saves all memberships to Keystore
   * 3. Sets an explicit active organization while enabling UI switching
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    const data = await this.request<LoginResponse>(
      'auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      },
      false,
    );

    // Persist credentials in Keystore
    await SecureStorageService.setAccessToken(data.accessToken);
    await SecureStorageService.setRefreshToken(data.refreshToken);
    await SecureStorageService.setUserProfile(data.user);

    // Fetch all organizations to avoid blind / silent fallback
    let allOrgs = await this.getUserOrganizations(data.accessToken);

    let activeOrg: Organization | null = null;
    if (data.organization && data.organization.id) {
      activeOrg = data.organization;
      if (!allOrgs.some((o) => o.id === activeOrg?.id)) {
        allOrgs = [activeOrg, ...allOrgs];
      }
    } else if (allOrgs.length > 0) {
      activeOrg = allOrgs[0];
    } else {
      // Fallback: check /users/me
      try {
        const me = await this.getCurrentUser(data.accessToken);
        if (me && (me as any).organizationMemberships?.length > 0) {
          const mem = (me as any).organizationMemberships[0];
          activeOrg = {
            id: mem.organizationId,
            name: mem.organization?.name || 'Workspace',
            role: mem.role || 'MEMBER',
          };
          allOrgs = [activeOrg];
        }
      } catch {
        // No memberships
      }
    }

    await SecureStorageService.setAllOrganizations(allOrgs);
    if (activeOrg) {
      await SecureStorageService.setOrganization(activeOrg);
    }

    return {
      ...data,
      organization: activeOrg,
    };
  }

  /**
   * Logout (POST /api/v1/auth/logout) and clear local Keystore data
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken) {
        const baseUrl = await SecureStorageService.getApiBaseUrl();
        await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {
          // Non-blocking logout network failure
        });
      }
    } finally {
      await SecureStorageService.clearAllAuthData();
    }
  }

  /**
   * Fetch current user profile (GET /api/v1/users/me)
   */
  static async getCurrentUser(explicitToken?: string): Promise<UserProfile> {
    const headers: Record<string, string> = {};
    if (explicitToken) {
      headers['Authorization'] = `Bearer ${explicitToken}`;
    }
    return this.request<UserProfile>(
      'users/me',
      {
        method: 'GET',
        headers,
      },
      !explicitToken,
    );
  }

  /**
   * Fetch incoming delegated sessions for an organization
   * (GET /api/v1/organizations/:orgId/sessions/incoming)
   */
  static async getIncomingSessions(orgId: string): Promise<DelegatedSession[]> {
    if (!orgId) {
      throw new ApiError('Organization ID is required to fetch incoming sessions', 400);
    }
    const rawSessions = await this.request<any[]>(
      `organizations/${orgId}/sessions/incoming`,
      {
        method: 'GET',
      },
      true,
    );

    return (rawSessions || []).map((raw) => {
      const platform = (
        raw.platform ||
        raw.integrationProvider ||
        raw.platformId ||
        raw.resourceName ||
        'UNKNOWN'
      ).toUpperCase();

      const permittedUsername =
        raw.permittedUsername ||
        raw.grantor?.email ||
        raw.grantor?.fullName ||
        'Delegated User';

      const secretName = raw.secretName || raw.resourceName || platform;

      return {
        ...raw,
        platform,
        permittedUsername,
        secretName,
      };
    });
  }

  /**
   * Launch delegated session credentials via verified backend endpoint
   * (POST /api/v1/organizations/:orgId/sessions/:sessionId/launch)
   */
  static async launchSession(
    orgId: string,
    sessionId: string,
    reason: string = 'Mobile secure browser autofill',
  ): Promise<{ plaintext: string }> {
    if (!orgId || !sessionId) {
      throw new ApiError('Organization ID and Session ID are required to launch session', 400);
    }
    return this.request<{ plaintext: string }>(
      `organizations/${orgId}/sessions/${sessionId}/launch`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      true,
    );
  }

  /**
   * Fetch OTP from grantor Gmail for an active delegated session
   * (POST /api/v1/organizations/:orgId/sessions/:sessionId/otp)
   *
   * Security Boundary:
   * Returns only { otp: string | null }. Never receives email bodies or Gmail tokens.
   */
  static async fetchOtp(
    orgId: string,
    sessionId: string,
    platform?: string,
    loginStartTime?: number,
  ): Promise<{ otp: string | null }> {
    if (!orgId || !sessionId) {
      throw new ApiError('Organization ID and Session ID are required to fetch OTP', 400);
    }
    return this.request<{ otp: string | null }>(
      `organizations/${orgId}/sessions/${sessionId}/otp`,
      {
        method: 'POST',
        body: JSON.stringify({
          platform: platform ? platform.toUpperCase() : undefined,
          loginStartTime: loginStartTime || Date.now() - 60_000,
        }),
      },
      true,
    );
  }
}
