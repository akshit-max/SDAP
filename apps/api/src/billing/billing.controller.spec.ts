import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementService } from './subscription/entitlement.service';
import { HdfcWebhookGuard } from './hdfc/hdfc-webhook.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// HTTP-level check that both return URL verbs are actually routed — the bug was
// invisible to service-level tests because the decorators were the problem.
describe('BillingController — HDFC return URL routing', () => {
  let app: INestApplication;
  const billingService = { handleReturn: jest.fn() };
  const params = {
    order_id: 'wPMROUTE00000001',
    status: 'CHARGED',
    signature: 'sig',
    signature_algorithm: 'HMAC-SHA256',
  };

  beforeAll(async () => {
    process.env.APP_URL = 'https://app.example.com';
    const moduleRef = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: billingService },
        { provide: EntitlementService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(HdfcWebhookGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    billingService.handleReturn.mockReset().mockResolvedValue({
      success: true,
      orderId: params.order_id,
      redirectPath: `/pricing?success=true&order_id=${params.order_id}`,
    });
  });

  it('POST (form body) reaches handleReturn and redirects to the app', async () => {
    const res = await request(app.getHttpServer())
      .post('/billing/return')
      .type('form')
      .send(params);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      'https://app.example.com/pricing?success=true&order_id=wPMROUTE00000001',
    );
    expect(billingService.handleReturn).toHaveBeenCalledWith(params);
  });

  it('GET (query string) reaches handleReturn and redirects to the app', async () => {
    const res = await request(app.getHttpServer())
      .get('/billing/return')
      .query(params);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      'https://app.example.com/pricing?success=true&order_id=wPMROUTE00000001',
    );
    expect(billingService.handleReturn).toHaveBeenCalledWith(params);
  });
});
