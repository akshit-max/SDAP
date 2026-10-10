import { validate } from './env.validation';

describe('Environment Validation', () => {
  const baseValidConfig = {
    DATABASE_URL: 'postgres://localhost/db',
    VAULT_ENCRYPTION_KEY: '12345678901234567890123456789012',
  };

  const validHdfcConfig = {
    HDFC_BASE_URL: 'https://api.hdfc.com',
    HDFC_MERCHANT_ID: 'MERCH1',
    HDFC_CLIENT_ID: 'CLIENT1',
    HDFC_RESELLER_ID: 'RESELL1',
    HDFC_API_KEY: 'API_KEY_SEC',
    HDFC_RESPONSE_KEY: 'RESP_KEY_SEC',
    HDFC_WEBHOOK_USERNAME: 'WH_USER',
    HDFC_WEBHOOK_PASSWORD: 'WH_PASSWORD',
    HDFC_PAYMENT_PAGE_CLIENT_ID: 'PPC_ID',
    HDFC_RETURN_URL: 'https://return.url',
    HDFC_MAX_AMOUNT_PRO: '5000',
    HDFC_MAX_AMOUNT_BUSINESS: '25000',
  };

  describe('Production Environment', () => {
    it('succeeds when all required HDFC variables are present', () => {
      const config = {
        ...baseValidConfig,
        ...validHdfcConfig,
        NODE_ENV: 'production',
      };
      expect(() => validate(config)).not.toThrow();
    });

    it('throws clear error when a required HDFC variable is missing', () => {
      const config = {
        ...baseValidConfig,
        ...validHdfcConfig,
        NODE_ENV: 'production',
      };
      delete (config as any).HDFC_MERCHANT_ID;

      expect(() => validate(config)).toThrow(
        'HDFC_MERCHANT_ID is required in production',
      );
    });

    it('throws clear error when a required HDFC variable is empty', () => {
      const config = {
        ...baseValidConfig,
        ...validHdfcConfig,
        NODE_ENV: 'production',
        HDFC_API_KEY: '   ', // whitespace only
      };

      expect(() => validate(config)).toThrow(
        'HDFC_API_KEY is required in production',
      );
    });
  });

  describe('Non-Production Environments (Development/Test/UAT)', () => {
    it('succeeds in development without HDFC variables', () => {
      const config = {
        ...baseValidConfig,
        NODE_ENV: 'development',
      };
      expect(() => validate(config)).not.toThrow();
    });

    it('succeeds in development with partial or complete HDFC variables', () => {
      const config = {
        ...baseValidConfig,
        ...validHdfcConfig,
        NODE_ENV: 'development',
      };
      expect(() => validate(config)).not.toThrow();
    });

    it('succeeds in test without HDFC variables', () => {
      const config = {
        ...baseValidConfig,
        NODE_ENV: 'test',
      };
      expect(() => validate(config)).not.toThrow();
    });
  });
});
