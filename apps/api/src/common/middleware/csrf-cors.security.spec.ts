/**
 * F-001 security regression tests against the REAL main.ts configuration.
 *
 * How: NestFactory.create is mocked so importing main.ts runs bootstrap() against a
 * recorder instead of the real AppModule (no DB, no schedulers, no HDFC calls, no
 * listen). Every call bootstrap() makes (helmet, enableCors, cookieParser,
 * csrfMiddleware, rate limit, body parsers, filters, prefix) is then replayed IN ORDER
 * onto a real Nest test app, which serves:
 *   - the REAL BillingController (/billing/return, /billing/webhook) with the REAL
 *     HdfcWebhookGuard (BillingService / signature check mocked — not under test here),
 *   - stand-in routes guarded by the REAL JwtAuthGuard + REAL JwtStrategy.
 * So Nest's own ordering applies: app.use middleware (CORS → cookies → CSRF) runs
 * before route guards (Passport JWT).
 */
import * as crypto from 'crypto';
import request from 'supertest';
import {
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { BillingController } from '../../billing/billing.controller';
import { BillingService } from '../../billing/billing.service';
import { EntitlementService } from '../../billing/subscription/entitlement.service';
import { HdfcSignatureService } from '../../billing/hdfc/hdfc-signature.service';
import { csrfMiddleware } from './csrf.middleware';

// ── Make importing main.ts safe: record bootstrap() instead of starting the app ──
const mockCalls: Array<{ method: string; args: any[] }> = [];
jest.mock('../../app.module', () => ({ AppModule: class AppModule {} }));
jest.mock('@nestjs/core', () => {
  const actual = jest.requireActual('@nestjs/core');
  const rec =
    (method: string) =>
    (...args: any[]) => {
      mockCalls.push({ method, args });
    };
  return {
    ...actual,
    NestFactory: {
      create: jest.fn(async () => ({
        setGlobalPrefix: rec('setGlobalPrefix'),
        set: rec('set'),
        use: rec('use'),
        enableCors: rec('enableCors'),
        useGlobalFilters: rec('useGlobalFilters'),
        listen: jest.fn(),
      })),
    },
  };
});

const ALLOWED = 'https://app.withus.example';
const CSRF = 'a'.repeat(64);

@Controller()
class StandInController {
  @UseGuards(JwtAuthGuard)
  @Post('organizations/o/sessions/s/launch')
  launch(@Req() req: any) {
    return { user: req.user.id };
  }

  @UseGuards(JwtAuthGuard)
  @Post('organizations/o/vaults')
  createVault(@Req() req: any) {
    return { user: req.user.id };
  }
}

describe('F-001: real main.ts CORS + CSRF + JWT pipeline', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const jwt = new JwtService({
    privateKey,
    signOptions: { algorithm: 'RS256', expiresIn: '1h' },
  });
  const tokenFor = (sub: string) => jwt.sign({ sub, email: `${sub}@x.test` });

  const billingService = {
    handleReturn: jest
      .fn()
      .mockResolvedValue({ redirectPath: '/pricing?ok=1' }),
    handleWebhook: jest.fn().mockResolvedValue(undefined),
  };
  const WEBHOOK_AUTH = 'Basic aGRmYzpzZWNyZXQ=';

  let app: INestApplication;
  let http: any;
  const saved = {
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    APP_URL: process.env.APP_URL,
  };

  beforeAll(async () => {
    process.env.CORS_ORIGIN = ALLOWED;
    process.env.APP_URL = 'https://app.withus.example';

    // Runs the real bootstrap() against the recorder, with the PRODUCTION branch of
    // main.ts (HSTS on, Swagger off). NODE_ENV is restored right after.
    const prevEnv = process.env.NODE_ENV;
    const prevSwagger = process.env.SWAGGER_ENABLED;
    process.env.NODE_ENV = 'production';
    delete process.env.SWAGGER_ENABLED;
    // Plain require (not isolateModules) so main.ts shares this test's @nestjs/common,
    // otherwise its GlobalExceptionFilter can't recognise HttpExceptions (→ 500).
    require('../../main');
    await new Promise((r) => setImmediate(r));
    process.env.NODE_ENV = prevEnv;
    if (prevSwagger !== undefined) process.env.SWAGGER_ENABLED = prevSwagger;
    expect(mockCalls.some((c) => c.method === 'enableCors')).toBe(true);

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [BillingController, StandInController],
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { get: () => publicKey } },
        { provide: BillingService, useValue: billingService },
        { provide: EntitlementService, useValue: {} },
        {
          provide: HdfcSignatureService,
          useValue: {
            verifyWebhookAuth: (h?: string) => {
              if (h !== WEBHOOK_AUTH) throw new UnauthorizedException();
            },
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    // Replay exactly what main.ts bootstrap() did, in the same order.
    for (const { method, args } of mockCalls) (app as any)[method](...args);
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('main.ts registers CORS before cookie parsing, and cookies before CSRF', () => {
    const seq = mockCalls.map((c) =>
      c.method === 'use'
        ? c.args[0] === csrfMiddleware
          ? 'csrf'
          : c.args[0]?.name || 'anon'
        : c.method,
    );
    const iCors = seq.indexOf('enableCors');
    const iCookie = seq.indexOf('cookieParser');
    const iCsrf = seq.indexOf('csrf');
    expect(iCors).toBeGreaterThan(-1);
    expect(iCors).toBeLessThan(iCookie);
    expect(iCookie).toBeLessThan(iCsrf);
  });

  // ── Invalid Bearer cannot ride an existing cookie ──────────────────────────
  it.each(['Bearer x', `Bearer ${'e30.e30.sig'}`])(
    'cookie + invalid Bearer (%s) + extension header → 401',
    async (authz) => {
      await request(http)
        .post('/api/v1/organizations/o/sessions/s/launch')
        .set('Cookie', [`sdap_token=${tokenFor('victim')}`])
        .set('X-Extension-Client', 'withus-mv3')
        .set('Authorization', authz)
        .expect(401);
    },
  );

  it('valid extension Bearer authenticates as the Bearer user, ignoring any cookie', async () => {
    const res = await request(http)
      .post('/api/v1/organizations/o/sessions/s/launch')
      .set('Cookie', [`sdap_token=${tokenFor('other')}`])
      .set('X-Extension-Client', 'withus-mv3')
      .set('Authorization', `Bearer ${tokenFor('grantee')}`)
      .expect(201);
    expect(res.body.user).toBe('grantee');
  });

  // ── Web CSRF protection unchanged ──────────────────────────────────────────
  it('cookie auth without CSRF header → rejected (no handler run)', async () => {
    const res = await request(http)
      .post('/api/v1/organizations/o/vaults')
      .set('Cookie', [`sdap_token=${tokenFor('web')}`, `sdap_csrf=${CSRF}`]);
    expect(res.status).toBe(403);
  });

  it('cookie auth + extension header + non-Bearer Authorization → still rejected', async () => {
    const res = await request(http)
      .post('/api/v1/organizations/o/vaults')
      .set('Cookie', [`sdap_token=${tokenFor('web')}`, `sdap_csrf=${CSRF}`])
      .set('X-Extension-Client', 'withus-mv3')
      .set('Authorization', 'Basic abc');
    expect(res.status).toBe(403);
  });

  it('normal web request from configured origin with CSRF → works + CORS granted', async () => {
    const res = await request(http)
      .post('/api/v1/organizations/o/vaults')
      .set('Origin', ALLOWED)
      .set('Cookie', [`sdap_token=${tokenFor('web')}`, `sdap_csrf=${CSRF}`])
      .set('X-CSRF-Token', CSRF)
      .expect(201);
    expect(res.body.user).toBe('web');
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  // ── HDFC return: real BillingController reached, no CORS grant ──────────────
  it.each([
    'null',
    'https://smartgateway.hdfcbank.com',
    'https://api.juspay.in',
    undefined,
  ])(
    'POST /billing/return with Origin %s → real controller redirects',
    async (origin) => {
      billingService.handleReturn.mockClear();
      const r = request(http).post('/api/v1/billing/return');
      if (origin) r.set('Origin', origin);
      const res = await r
        .type('form')
        .send({ order_id: 'ord_1', status: 'CHARGED', signature: 's' })
        .expect(302);
      expect(res.headers.location).toBe(
        'https://app.withus.example/pricing?ok=1',
      );
      expect(billingService.handleReturn).toHaveBeenCalledWith(
        expect.objectContaining({ order_id: 'ord_1' }),
      );
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    },
  );

  it('GET /billing/return (query-string variant) → real controller redirects', async () => {
    await request(http)
      .get('/api/v1/billing/return?order_id=ord_2&status=CHARGED')
      .set('Origin', 'null')
      .expect(302);
  });

  // ── HDFC webhook: real guard + controller, exemption intact ────────────────
  it('POST /billing/webhook with valid Basic auth → 200 { received: true }', async () => {
    await request(http)
      .post('/api/v1/billing/webhook')
      .set('Authorization', WEBHOOK_AUTH)
      .send({ event_name: 'ORDER_SUCCEEDED' })
      .expect(200, { received: true });
    expect(billingService.handleWebhook).toHaveBeenCalled();
  });

  it('POST /billing/webhook with bad Basic auth → 401 from the real guard (unchanged)', async () => {
    await request(http)
      .post('/api/v1/billing/webhook')
      .set('Authorization', 'Basic bad')
      .send({})
      .expect(401);
  });

  // ── CORS on the real config ────────────────────────────────────────────────
  it('chrome-extension origin still allowed (unchanged)', async () => {
    const o = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const res = await request(http)
      .options('/api/v1/organizations/o/sessions/s/launch')
      .set('Origin', o)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe(o);
  });

  it.each([
    'null',
    'https://evil-hdfcbank.attacker.example',
    'https://smartgateway.hdfcbank.com',
    'https://juspay.attacker.example',
    'https://anything.loca.lt',
    'https://app.withus.example.attacker.example',
  ])(
    'Origin %s → no CORS permission (preflight and request)',
    async (origin) => {
      const pre = await request(http)
        .options('/api/v1/organizations/o/sessions/s/launch')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');
      expect(pre.headers['access-control-allow-origin']).toBeUndefined();
      expect(pre.headers['access-control-allow-credentials']).toBeUndefined();
      const res = await request(http)
        .post('/api/v1/organizations/o/sessions/s/launch')
        .set('Origin', origin);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    },
  );
});
