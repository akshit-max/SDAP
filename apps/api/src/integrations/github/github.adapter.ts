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

const GITHUB_API = 'https://api.github.com';

/**
 * GitHub Integration Adapter
 *
 * Uses GitHub REST API v3 with a Personal Access Token (PAT).
 * Requires: read:org, admin:org (for org member management)
 *           repo (for repository collaborator management)
 *
 * GitHub API docs: https://docs.github.com/en/rest
 */
@Injectable()
export class GitHubAdapter implements IIntegrationAdapter {
  readonly provider = IntegrationProvider.GITHUB;
  private readonly logger = new Logger(GitHubAdapter.name);

  // ─── Validate Token ─────────────────────────────────────────────────────────

  async validateToken(token: string): Promise<{ identity: string; meta?: Record<string, unknown> }> {
    const user = await this.get('/user', token);
    if (!user?.login) throw new Error('Could not retrieve user info from GitHub. Check your PAT scopes.');
    return {
      identity: `${user.name || user.login} (${user.email || user.login})`,
      meta: { login: user.login, userId: user.id, avatarUrl: user.avatar_url },
    };
  }

  // ─── Health Check ───────────────────────────────────────────────────────────

  async healthCheck(token: string): Promise<HealthCheckResult> {
    const checkedAt = new Date();
    try {
      const user = await this.get('/user', token);
      if (!user?.login) return { healthy: false, error: 'No user data returned', checkedAt };
      return { healthy: true, identity: `${user.name || user.login}`, checkedAt };
    } catch (err: unknown) {
      return { healthy: false, error: (err as Error).message, checkedAt };
    }
  }

  // ─── List Resources ─────────────────────────────────────────────────────────

  /**
   * Returns the authenticated user's GitHub organizations.
   * Each org login can be used as a resourceId in grantAccess / revokeAccess.
   */
  async listResources(token: string): Promise<IntegrationResource[]> {
    const orgs: any[] = await this.get('/user/orgs?per_page=100', token);
    return (orgs || []).map((o) => ({
      id: o.login,
      name: o.login,
      url: o.url,
      type: 'ORGANIZATION' as const,
    }));
  }

  // ─── Grant Access ───────────────────────────────────────────────────────────

  /**
   * Invite a user to a GitHub Organization (or add as outside collaborator).
   * resourceId = org login (e.g. "acme-corp")
   * principalEmail = GitHub username OR email (GitHub invites by username for orgs)
   * role = "member" | "admin" (defaults to "member")
   *
   * Note: GitHub org invitations are async — the user must accept the invite.
   */
  async grantAccess(token: string, input: GrantAccessInput): Promise<GrantAccessResult> {
    const role = input.role || 'member';
    this.logger.log(`[GITHUB] Inviting ${input.principalEmail} to org ${input.resourceId} as ${role}`);

    // GitHub org membership endpoint: PUT /orgs/{org}/memberships/{username}
    const res = await this.put(
      `/orgs/${input.resourceId}/memberships/${input.principalEmail}`,
      token,
      { role },
    );

    const status = res?.state === 'active' ? 'ACTIVE' : 'PENDING_INVITE';
    return {
      referenceId: input.principalEmail, // GitHub uses username as stable ref
      status,
      meta: res,
    };
  }

  // ─── Revoke Access ──────────────────────────────────────────────────────────

  /**
   * Remove a user from a GitHub Organization.
   * resourceId = org login, principalEmail = GitHub username.
   */
  async revokeAccess(token: string, input: RevokeAccessInput): Promise<void> {
    const username = input.referenceId || input.principalEmail;
    this.logger.log(`[GITHUB] Removing ${username} from org ${input.resourceId}`);
    // DELETE /orgs/{org}/members/{username}
    await this.delete(`/orgs/${input.resourceId}/members/${username}`, token);
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────────

  private async get(path: string, token: string): Promise<any> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers: this.headers(token),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  private async put(path: string, token: string, body: unknown): Promise<any> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      method: 'PUT',
      headers: { ...this.headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  private async delete(path: string, token: string): Promise<void> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      method: 'DELETE',
      headers: this.headers(token),
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${text}`);
    }
  }

  private headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }
}
