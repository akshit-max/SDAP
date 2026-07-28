import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService, EncryptionContext } from './encryption.service';
import * as crypto from 'crypto';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let originalEnv: NodeJS.ProcessEnv;
  const mockMek = crypto.randomBytes(32).toString('base64'); // Mock 256-bit key

  const mockContext: EncryptionContext = {
    organizationId: 'org-123',
    vaultId: 'vault-456',
    secretId: 'secret-789',
    version: 1,
  };

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, VAULT_ENCRYPTION_KEY: mockMek };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
    it('should throw if VAULT_ENCRYPTION_KEY is missing', () => {
      delete process.env.VAULT_ENCRYPTION_KEY;
      expect(() => new EncryptionService()).toThrow();
      process.env.VAULT_ENCRYPTION_KEY = mockMek; // restore
    });

    it('should throw if VAULT_ENCRYPTION_KEY is not 32 bytes', () => {
      process.env.VAULT_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64');
      expect(() => new EncryptionService()).toThrow();
      process.env.VAULT_ENCRYPTION_KEY = mockMek; // restore
    });
  });

  describe('DEK Generation and Encryption', () => {
    it('should generate a 32-byte DEK', () => {
      const dek = service.generateDEK();
      expect(dek).toBeInstanceOf(Buffer);
      expect(dek.length).toBe(32);
    });

    it('should encrypt and decrypt a DEK using MEK', () => {
      const dek = service.generateDEK();
      const encrypted = service.encryptDEK(dek);

      expect(encrypted.ciphertext).toBeInstanceOf(Buffer);
      expect(encrypted.iv.length).toBe(12);
      expect(encrypted.authTag.length).toBe(16);

      const decryptedDek = service.decryptDEK(encrypted.ciphertext, encrypted.iv, encrypted.authTag);
      expect(decryptedDek.equals(dek)).toBe(true);
    });

    it('should produce different ciphertexts for the same DEK (random IV)', () => {
      const dek = service.generateDEK();
      const enc1 = service.encryptDEK(dek);
      const enc2 = service.encryptDEK(dek);

      expect(enc1.ciphertext.equals(enc2.ciphertext)).toBe(false);
      expect(enc1.iv.equals(enc2.iv)).toBe(false);
    });
  });

  describe('Payload Encryption and Envelope Strategy', () => {
    let dek: Buffer;

    beforeEach(() => {
      dek = service.generateDEK();
    });

    it('should encrypt and decrypt payload successfully', () => {
      const plaintext = Buffer.from('SuperSecretPassword123');
      const encrypted = service.encryptPayload(plaintext, dek, mockContext);

      const decrypted = service.decryptPayload(encrypted.ciphertext, dek, encrypted.iv, encrypted.authTag, mockContext);
      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('should generate a valid fingerprint for the plaintext', () => {
      const plaintext = Buffer.from('SuperSecretPassword123');
      const encrypted = service.encryptPayload(plaintext, dek, mockContext);
      
      const expectedHash = crypto.createHash('sha256').update(plaintext).digest('hex');
      expect(encrypted.fingerprint).toBe(expectedHash);
    });

    it('should fail decryption if DEK is wrong', () => {
      const plaintext = Buffer.from('SuperSecretPassword123');
      const encrypted = service.encryptPayload(plaintext, dek, mockContext);
      
      const wrongDek = service.generateDEK();
      
      expect(() => {
        service.decryptPayload(encrypted.ciphertext, wrongDek, encrypted.iv, encrypted.authTag, mockContext);
      }).toThrow('Decryption failed');
    });

    it('should fail decryption if ciphertext is tampered', () => {
      const plaintext = Buffer.from('SuperSecretPassword123');
      const encrypted = service.encryptPayload(plaintext, dek, mockContext);
      
      // Tamper with the first byte
      const tamperedCiphertext = Buffer.from(encrypted.ciphertext);
      tamperedCiphertext[0] ^= 1;
      
      expect(() => {
        service.decryptPayload(tamperedCiphertext, dek, encrypted.iv, encrypted.authTag, mockContext);
      }).toThrow('Decryption failed');
    });

    it('should fail decryption if authTag is tampered', () => {
      const plaintext = Buffer.from('SuperSecretPassword123');
      const encrypted = service.encryptPayload(plaintext, dek, mockContext);
      
      // Tamper with auth tag
      const tamperedTag = Buffer.from(encrypted.authTag);
      tamperedTag[0] ^= 1;
      
      expect(() => {
        service.decryptPayload(encrypted.ciphertext, dek, encrypted.iv, tamperedTag, mockContext);
      }).toThrow('Decryption failed');
    });
  });

  describe('Additional Authenticated Data (AAD) Protections', () => {
    let dek: Buffer;
    let encryptedPayload: EncryptionResult;
    const plaintext = Buffer.from('DataThatMustNotBeRelocated');

    beforeEach(() => {
      dek = service.generateDEK();
      encryptedPayload = service.encryptPayload(plaintext, dek, mockContext);
    });

    it('should decrypt with identical AAD context', () => {
      const decrypted = service.decryptPayload(
        encryptedPayload.ciphertext, 
        dek, 
        encryptedPayload.iv, 
        encryptedPayload.authTag, 
        mockContext
      );
      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('should fail decryption if organizationId changes (ciphertext relocation)', () => {
      const tamperedContext = { ...mockContext, organizationId: 'hacker-org-999' };
      expect(() => {
        service.decryptPayload(
          encryptedPayload.ciphertext, 
          dek, 
          encryptedPayload.iv, 
          encryptedPayload.authTag, 
          tamperedContext
        );
      }).toThrow('Decryption failed');
    });

    it('should fail decryption if vaultId changes', () => {
      const tamperedContext = { ...mockContext, vaultId: 'another-vault' };
      expect(() => {
        service.decryptPayload(
          encryptedPayload.ciphertext, 
          dek, 
          encryptedPayload.iv, 
          encryptedPayload.authTag, 
          tamperedContext
        );
      }).toThrow('Decryption failed');
    });

    it('should fail decryption if secretId changes', () => {
      const tamperedContext = { ...mockContext, secretId: 'another-secret' };
      expect(() => {
        service.decryptPayload(
          encryptedPayload.ciphertext, 
          dek, 
          encryptedPayload.iv, 
          encryptedPayload.authTag, 
          tamperedContext
        );
      }).toThrow('Decryption failed');
    });

    it('should fail decryption if version changes', () => {
      const tamperedContext = { ...mockContext, version: 2 }; // Trying to rollback by swapping ciphertexts
      expect(() => {
        service.decryptPayload(
          encryptedPayload.ciphertext, 
          dek, 
          encryptedPayload.iv, 
          encryptedPayload.authTag, 
          tamperedContext
        );
      }).toThrow('Decryption failed');
    });
  });
});
