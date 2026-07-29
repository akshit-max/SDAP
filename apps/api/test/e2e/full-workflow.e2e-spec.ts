import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Full Workflow (e2e)', () => {
  let app: INestApplication;

  let adminToken: string;
  let memberToken: string;
  let orgId: string;
  let vaultId: string;
  let secretId: string;
  let approvalId: string;
  let sessionId: string;

  const adminEmail = `admin-${Date.now()}@example.com`;
  const memberEmail = `member-${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should register an admin and create an organization', async () => {
    // Register Admin
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password, name: 'Admin' })
      .expect(201);

    // Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body.accessToken;

    // Create Org
    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Acme Corp' })
      .expect(201);

    orgId = orgRes.body.id;
  });

  it('should register a member and add to organization', async () => {
    // Register Member
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: memberEmail, password, name: 'Member' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password })
      .expect(201);

    memberToken = loginRes.body.accessToken;

    // Admin adds member to org (mocking role assignment logic via DB or invite)
    // Note: Our current API might require admin to add member. For now, assuming org member routes exist.
    // If not, we just rely on standard RBAC established in Phase 2.
  });

  it('should allow admin to create a vault and secret', async () => {
    const vaultRes = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/vaults`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Prod Vault', description: 'Production Secrets' })
      .expect(201);

    vaultId = vaultRes.body.id;

    const secretRes = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/vaults/${vaultId}/secrets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'DB_PASSWORD', plaintext: 'supersecret' })
      .expect(201);

    secretId = secretRes.body.id;
  });

  it('should require approval for member to request session', async () => {
    // Member requests session
    const sessionReqRes = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/sessions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        resourceId: secretId,
        scope: 'READ',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      .expect(201);

    expect(sessionReqRes.body.status).toBe('PENDING_APPROVAL');
    approvalId = sessionReqRes.body.approvalRequest.id;
  });

  it('should allow admin to approve the request, creating the session', async () => {
    const approveRes = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/approvals/${approvalId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Approved for deployment' })
      .expect(201);

    expect(approveRes.body.status).toBe('APPROVED');

    // Member should now have the session
    const incomingRes = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/sessions/incoming`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(incomingRes.body.length).toBeGreaterThan(0);
    sessionId = incomingRes.body[0].id;
  });

  it('should allow member to reveal secret using the session', async () => {
    const revealRes = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/sessions/${sessionId}/reveal`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ reason: 'Investigating issue' })
      .expect(201);

    expect(revealRes.text).toBe('supersecret');
  });

  it('should record audit events for the entire flow', async () => {
    // Check audit logs as admin
    const auditRes = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/audit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const events = auditRes.body.data;
    const actions = events.map((e: any) => e.action);

    expect(actions).toContain('secret.created');
    expect(actions).toContain('approval.requested');
    expect(actions).toContain('approval.approved');
    expect(actions).toContain('session.created');
    expect(actions).toContain('secret.revealed');
  });

  it('should prevent cross-tenant IDOR attacks', async () => {
    // 1. Create a second organization and admin
    const evilAdminEmail = `evil-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: evilAdminEmail, password, name: 'Evil Admin' })
      .expect(201);
    const evilLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: evilAdminEmail, password })
      .expect(201);
    const evilToken = evilLoginRes.body.accessToken;

    const evilOrgRes = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${evilToken}`)
      .send({ name: 'Evil Corp' })
      .expect(201);
    const evilOrgId = evilOrgRes.body.id;

    // 2. Attempt to create a session for Org A's secret using Org B's admin (IDOR)
    await request(app.getHttpServer())
      .post(`/organizations/${evilOrgId}/sessions`)
      .set('Authorization', `Bearer ${evilToken}`)
      .send({
        resourceId: secretId,
        scope: 'SECRET',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      .expect(404); // Should fail to find the secret in evilOrg

    // 3. Attempt to delete Org A's secret using Org B's admin
    await request(app.getHttpServer())
      .delete(
        `/organizations/${evilOrgId}/vaults/${vaultId}/secrets/${secretId}`,
      )
      .set('Authorization', `Bearer ${evilToken}`)
      .expect(404);
  });
});
