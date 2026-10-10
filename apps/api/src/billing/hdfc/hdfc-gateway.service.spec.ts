import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HdfcGatewayService } from './hdfc-gateway.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('HdfcGatewayService', () => {
  let service: HdfcGatewayService;
  let fetchMock: jest.Mock;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      switch (key) {
        case 'HDFC_BASE_URL':
          return 'https://smartgateway.hdfcbank.com';
        case 'HDFC_MERCHANT_ID':
          return 'test_merchant';
        case 'HDFC_CLIENT_ID':
          return 'test_client';
        case 'HDFC_RESELLER_ID':
          return 'test_reseller';
        case 'HDFC_API_KEY':
          return 'test_api_key';
        default:
          return 'test_default';
      }
    }),
  };

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HdfcGatewayService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HdfcGatewayService>(HdfcGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const expectedAuthHeader = `Basic ${Buffer.from('test_api_key').toString('base64')}`;

  const expectedHeaders = {
    Authorization: expectedAuthHeader,
    'x-merchantid': 'test_merchant',
    'x-customerid': 'test_client',
    'x-resellerid': 'test_reseller',
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeMandateCharge', () => {
    it('should send POST /txns with url-encoded fields including mandate_id', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'SUCCESS' }),
      });

      const executePayload = {
        order_id: 'test_order_123',
        amount: '100.00',
        currency: 'INR',
        customer_id: 'cust_001',
      };

      await service.executeMandateCharge('mandate_123', executePayload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toBe('https://smartgateway.hdfcbank.com/txns');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );
      expect(options.headers['Authorization']).toBe(expectedAuthHeader);

      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get('order.order_id')).toBe('test_order_123');
      expect(bodyParams.get('order.amount')).toBe('100.00');
      expect(bodyParams.get('order.currency')).toBe('INR');
      expect(bodyParams.get('customer.id')).toBe('cust_001');
      expect(bodyParams.get('mandate_id')).toBe('mandate_123');
    });
  });

  describe('revokeMandate', () => {
    it('should send POST /mandates/{mandateId} with url-encoded command=revoke', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'SUCCESS' }),
      });

      await service.revokeMandate('mandate_456');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toBe(
        'https://smartgateway.hdfcbank.com/mandates/mandate_456',
      );
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );

      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get('command')).toBe('revoke');
    });
  });

  describe('getMandateStatus', () => {
    it('should send POST /mandates/{mandateId} with url-encoded command=check_status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ACTIVE' }),
      });

      await service.getMandateStatus('mandate_789');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toBe(
        'https://smartgateway.hdfcbank.com/mandates/mandate_789',
      );
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );

      const bodyParams = new URLSearchParams(options.body as string);
      expect(bodyParams.get('command')).toBe('check_status');
    });
  });

  describe('createSessionWithMandate', () => {
    it('should preserve JSON encoding for /session', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'NEW' }),
      });

      const sessionPayload: any = {
        order_id: 'ord_123',
        amount: '500',
        customer_id: 'cust_abc',
      };

      await service.createSessionWithMandate(sessionPayload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toBe('https://smartgateway.hdfcbank.com/session');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toBe(expectedAuthHeader);

      const bodyData = JSON.parse(options.body as string);
      expect(bodyData.order_id).toBe('ord_123');
    });
  });

  describe('HTTP error handling', () => {
    it('should throw InternalServerErrorException on !res.ok and preserve existing behavior', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request Details',
      });

      await expect(service.revokeMandate('mandate_fail')).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(service.revokeMandate('mandate_fail')).rejects.toThrow(
        /HDFC API POST \/mandates\/mandate_fail returned 400: Bad Request Details/,
      );
    });
  });
});
