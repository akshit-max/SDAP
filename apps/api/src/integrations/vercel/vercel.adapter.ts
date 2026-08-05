import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import {
  IIntegrationAdapter,
  IProviderIdentityResolver,
  HealthCheckResult,
  IntegrationResource,
  GrantAccessInput,
  GrantAccessResult,
  RevokeAccessInput,
} from '../core/integration-adapter.interface';

const VERCEL_API = 'https://api.vercel.com';

/**
 * Vercel Integration Adapter
 *
 * Uses the Vercel REST API v9 with a Personal Access Token (PAT).
 * Manages team membership — invite, remove, list resources.
 *
 * Vercel API docs: https://vercel.com/docs/rest-api
 */
@Injectable()
export class VercelAdapter implements IIntegrationAdapter, IProviderIdentityResolver {
  readonly provider = IntegrationProvider.VERCEL;
  private readonly logger = new Logger(VercelAdapter.name);

  // ─── Identity Resolution ────────────────────────────────────────────────────

  resolvePrincipalId(user: { id: string; email: string; providerProfiles?: unknown }): string {
    // Vercel invitations use the user's email address
    if (!user.email) {
      throw new Error('Grantee has no email address configured.');
    }
    return user.email;
  }

  // ─── Validate Token ─────────────────────────────────────────────────────────

  async validateToken(token: string): Promise<{ identity: string; meta?: Record<string, unknown> }> {
    const res = await this.get('/v2/user', token);
    const email = res?.user?.email;
    const name = res?.user?.name || res?.user?.username;
    if (!email) throw new Error('Could not retrieve user info from Vercel. Check your PAT.');
    return {
      identity: `${name} (${email})`,
      meta: { userId: res.user.id, username: res.user.username },
    };
  }

  // ─── Health Check ───────────────────────────────────────────────────────────

  async healthCheck(token: string): Promise<HealthCheckResult> {
    const checkedAt = new Date();
    try {
      const res = await this.get('/v2/user', token);
      const email = res?.user?.email;
      if (!email) return { healthy: false, error: 'No user data returned', checkedAt };
      return { healthy: true, identity: `${res.user.name} (${email})`, checkedAt };
    } catch (err: unknown) {
      return { healthy: false, error: (err as Error).message, checkedAt };
    }
  }

  // ─── List Resources ─────────────────────────────────────────────────────────

  /**
   * Returns the user's Vercel teams as resources.
   * Each team ID can be used as a resourceId in grantAccess / revokeAccess.
   */
  async listResources(token: string): Promise<IntegrationResource[]> {
    const res = await this.get('/v2/teams?limit=100', token);
    const teams: any[] = res?.teams || [];
    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      url: `https://vercel.com/${t.slug}`,
      type: 'TEAM' as const,
    }));
  }

  // ─── Grant Access ───────────────────────────────────────────────────────────

  /**
   * Invite a user to a Vercel team.
   * resourceId = teamId, principalEmail = email to invite.
   * role defaults to "MEMBER" (Vercel: "member").
   */
  async grantAccess(token: string, input: GrantAccessInput): Promise<GrantAccessResult> {
    const role = input.role || 'MEMBER';
    this.logger.log(`[VERCEL] Inviting ${input.principalEmail} to team ${input.resourceId} as ${role}`);

    const res = await this.post(
      `/v1/teams/${input.resourceId}/members`,
      token,
      { email: input.principalEmail, role },
    ).catch((err: Error) => {
      const msg = err.message;
      if (msg.includes('403') || msg.toLowerCase().includes('hobby') || msg.toLowerCase().includes('pro plan')) {
        throw new Error('Vercel Team collaboration requires a Pro plan. Your connected account is on the Hobby plan.');
      }
      if (msg.includes('409') || msg.includes('400') || msg.includes('already')) {
        this.logger.warn(`[VERCEL] ${input.principalEmail} already in team — skipping invite`);
        return { uid: input.principalEmail, confirmed: true };
      }
      throw err;
    });

    const referenceId = res?.uid || res?.id || input.principalEmail;
    const status = res?.confirmed === false ? 'PENDING_INVITE' : 'ACTIVE';

    return { referenceId: String(referenceId), status, meta: res };
  }

  // ─── Revoke Access ──────────────────────────────────────────────────────────

  /**
   * Remove a user from a Vercel team.
   * Requires the user's Vercel UID (referenceId from grantAccess).
   */
  async revokeAccess(token: string, input: RevokeAccessInput): Promise<void> {
    const userId = input.referenceId || input.principalEmail;
    this.logger.log(`[VERCEL] Removing ${userId} from team ${input.resourceId}`);
    await this.delete(`/v1/teams/${input.resourceId}/members/${userId}`, token);
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────────

  private async get(path: string, token: string): Promise<any> {
    const res = await fetch(`${VERCEL_API}${path}`, {
      headers: this.headers(token),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vercel API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  private async post(path: string, token: string, body: unknown): Promise<any> {
    const res = await fetch(`${VERCEL_API}${path}`, {
      method: 'POST',
      headers: { ...this.headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  private async delete(path: string, token: string): Promise<void> {
    const res = await fetch(`${VERCEL_API}${path}`, {
      method: 'DELETE',
      headers: this.headers(token),
    });
    // 404 = already removed — idempotent success
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`Vercel API error ${res.status}: ${text}`);
    }
  }

  private headers(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }
}
