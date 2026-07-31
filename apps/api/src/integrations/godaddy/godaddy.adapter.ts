import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import {
  IIntegrationAdapter,
  HealthCheckResult,
  IntegrationResource,
  GrantAccessInput,
  GrantAccessResult,
  RevokeAccessInput,
} from '../core/integration-adapter.interface';

const GODADDY_API = 'https://api.godaddy.com';

/**
 * GoDaddy Integration Adapter
 *
 * ⚠️ IMPORTANT LIMITATION:
 * GoDaddy does NOT support programmatic delegate management via their API.
 * Dashboard access delegation must be performed via the Browser Extension (D-4).
 *
 * This adapter is limited to:
 *  - PAT validation (confirms the key is valid and readable)
 *  - Health checks (confirms the key still works)
 *  - Listing resources (domains and DNS zones the PAT can manage)
 *
 * grantAccess / revokeAccess are NOT supported by GoDaddy API.
 * Those operations are handled by the Browser Extension fallback.
 *
 * PAT distribution for CI/CD: handled by Programmatic Secret API (D-6).
 *
 * GoDaddy API docs: https://developer.godaddy.com/doc
 */
@Injectable()
export class GoDaddyAdapter implements IIntegrationAdapter {
  readonly provider = IntegrationProvider.GODADDY;
  private readonly logger = new Logger(GoDaddyAdapter.name);

  // ─── Validate Token ─────────────────────────────────────────────────────────

  async validateToken(token: string): Promise<{ identity: string; meta?: Record<string, unknown> }> {
    // GoDaddy API key format: "key:secret"
    const [key] = token.split(':');
    if (!key) throw new Error('Invalid GoDaddy API key format. Expected "key:secret".');

    // Verify by listing domains (a real API call)
    const domains = await this.get('/v1/domains?limit=1', token);
    if (!Array.isArray(domains)) throw new Error('Invalid response from GoDaddy API.');

    return {
      identity: `GoDaddy API Key (${key.slice(0, 8)}…)`,
      meta: { keyPrefix: key.slice(0, 8) },
    };
  }

  // ─── Health Check ───────────────────────────────────────────────────────────

  async healthCheck(token: string): Promise<HealthCheckResult> {
    const checkedAt = new Date();
    try {
      const domains = await this.get('/v1/domains?limit=1', token);
      if (!Array.isArray(domains)) return { healthy: false, error: 'Unexpected response', checkedAt };
      return { healthy: true, identity: 'GoDaddy API connection verified', checkedAt };
    } catch (err: unknown) {
      return { healthy: false, error: (err as Error).message, checkedAt };
    }
  }

  // ─── List Resources ─────────────────────────────────────────────────────────

  /**
   * Lists GoDaddy domains manageable by this PAT.
   */
  async listResources(token: string): Promise<IntegrationResource[]> {
    const domains: any[] = await this.get('/v1/domains?limit=100&statuses=ACTIVE', token);
    return (domains || []).map((d) => ({
      id: d.domain,
      name: d.domain,
      url: `https://dcc.godaddy.com/manage/${d.domain}/dns`,
      type: 'ACCOUNT' as const,
    }));
  }

  // ─── Grant / Revoke (Not Supported) ─────────────────────────────────────────

  async grantAccess(_token: string, _input: GrantAccessInput): Promise<GrantAccessResult> {
    throw new Error(
      'GoDaddy does not support programmatic delegate management. ' +
      'Use the WITHUS Browser Extension to grant dashboard access, ' +
      'or the Programmatic Secret API to distribute this PAT.',
    );
  }

  async revokeAccess(_token: string, _input: RevokeAccessInput): Promise<void> {
    throw new Error(
      'GoDaddy does not support programmatic delegate revocation. ' +
      'Revoke the PAT directly in your GoDaddy Developer Portal.',
    );
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────────

  private async get(path: string, token: string): Promise<any> {
    const res = await fetch(`${GODADDY_API}${path}`, {
      headers: this.headers(token),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GoDaddy API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  private headers(token: string): Record<string, string> {
    // GoDaddy uses "sso-key key:secret" Authorization header
    return { Authorization: `sso-key ${token}` };
  }
}
