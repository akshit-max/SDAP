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
 * Supports a generic resource model:
 *   - resourceType = "ORGANIZATION" → manage org membership
 *   - resourceType = "REPOSITORY"   → manage repo collaborators (owner/repo)
 *   - resourceType = "TEAM"         → manage team membership (orgSlug/teamSlug)
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
   * Returns the authenticated user's GitHub organizations AND their repositories.
   * Callers can filter by resourceType to select which they want.
   */
  async listResources(token: string): Promise<IntegrationResource[]> {
    const [orgs, repos] = await Promise.all([
      this.get('/user/orgs?per_page=100', token).catch(() => []),
      this.get('/user/repos?per_page=100&affiliation=owner,organization_member', token).catch(() => []),
    ]);

    const orgResources: IntegrationResource[] = (orgs as any[]).map((o) => ({
      id: o.login,
      name: o.login,
      url: `https://github.com/${o.login}`,
      type: 'ORGANIZATION' as const,
    }));

    const repoResources: IntegrationResource[] = (repos as any[]).map((r) => ({
      id: r.full_name, // "owner/repo"
      name: r.full_name,
      url: r.html_url,
      type: 'REPOSITORY' as const,
    }));

    return [...orgResources, ...repoResources];
  }

  // ─── Grant Access ───────────────────────────────────────────────────────────

  /**
   * Grant access to a GitHub resource.
   * Routes to the correct API endpoint based on resourceType:
   *   - ORGANIZATION: PUT /orgs/{org}/memberships/{username}
   *   - REPOSITORY:   PUT /repos/{owner}/{repo}/collaborators/{username}
   *   - TEAM:         PUT /orgs/{org}/teams/{team_slug}/memberships/{username}
   *
   * Idempotent: if the user already has the requested access, returns success without error.
   */
  async grantAccess(token: string, input: GrantAccessInput): Promise<GrantAccessResult> {
    const resourceType = input.resourceType ?? 'ORGANIZATION';
    const role = input.role || 'member';

    this.logger.log(
      `[GITHUB] grantAccess type=${resourceType} resource=${input.resourceId} principal=${input.principalEmail} role=${role}`,
    );

    switch (resourceType) {
      case 'REPOSITORY': {
        // resourceId = "owner/repo"
        const permission = role === 'admin' ? 'admin' : role === 'write' ? 'push' : 'pull';
        const res = await this.put(
          `/repos/${input.resourceId}/collaborators/${input.principalEmail}`,
          token,
          { permission },
        ).catch((err) => {
          // 422 = already a collaborator — treat as success
          if (String(err.message).includes('422')) return { referenceId: input.principalEmail };
          throw err;
        });
        return {
          referenceId: input.principalEmail,
          status: (res as any)?.id ? 'PENDING_INVITE' : 'ACTIVE',
          meta: res as any,
        };
      }

      case 'TEAM': {
        // resourceId = "orgSlug/team-slug"
        const [org, teamSlug] = input.resourceId.split('/');
        const teamRole = role === 'maintainer' ? 'maintainer' : 'member';
        const res = await this.put(
          `/orgs/${org}/teams/${teamSlug}/memberships/${input.principalEmail}`,
          token,
          { role: teamRole },
        );
        const status = (res as any)?.state === 'active' ? 'ACTIVE' : 'PENDING_INVITE';
        return { referenceId: input.principalEmail, status, meta: res as any };
      }

      case 'ORGANIZATION':
      default: {
        // resourceId = orgLogin
        const orgRole = role === 'admin' ? 'admin' : 'member';
        const res = await this.put(
          `/orgs/${input.resourceId}/memberships/${input.principalEmail}`,
          token,
          { role: orgRole },
        ).catch((err) => {
          // 422 = already a member — treat as success
          if (String(err.message).includes('422')) return { state: 'active' };
          throw err;
        });
        const status = (res as any)?.state === 'active' ? 'ACTIVE' : 'PENDING_INVITE';
        return { referenceId: input.principalEmail, status, meta: res as any };
      }
    }
  }

  // ─── Revoke Access ──────────────────────────────────────────────────────────

  /**
   * Revoke access from a GitHub resource.
   * Routes based on resourceType. Idempotent: 404 (already removed) is treated as success.
   */
  async revokeAccess(token: string, input: RevokeAccessInput): Promise<void> {
    const resourceType = input.resourceType ?? 'ORGANIZATION';
    const username = input.referenceId || input.principalEmail;

    this.logger.log(
      `[GITHUB] revokeAccess type=${resourceType} resource=${input.resourceId} principal=${username}`,
    );

    switch (resourceType) {
      case 'REPOSITORY': {
        // DELETE /repos/{owner}/{repo}/collaborators/{username}
        await this.delete(`/repos/${input.resourceId}/collaborators/${username}`, token);
        break;
      }

      case 'TEAM': {
        // DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}
        const [org, teamSlug] = input.resourceId.split('/');
        await this.delete(`/orgs/${org}/teams/${teamSlug}/memberships/${username}`, token);
        break;
      }

      case 'ORGANIZATION':
      default: {
        // DELETE /orgs/{org}/members/{username}
        await this.delete(`/orgs/${input.resourceId}/members/${username}`, token);
        break;
      }
    }
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
    // 204 No Content is a valid success response
    if (res.status === 204) return {};
    return res.json();
  }

  private async delete(path: string, token: string): Promise<void> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      method: 'DELETE',
      headers: this.headers(token),
    });
    // 404 = already removed — idempotent success
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
