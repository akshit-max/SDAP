import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const ALGORITHM = 'AES-256-GCM';

// Standalone encryption helpers matching EncryptionService logic for verification
function deriveKey(mek: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(mek, salt, 100000, 32, 'sha256');
}

function decryptDEK(ciphertext: string, iv: string, authTag: string, mekBase64: string): Buffer {
  const mek = Buffer.from(mekBase64, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, mek, ivBuffer) as crypto.DecipherGCM;
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted;
}

function encryptPayload(plaintext: Buffer, dek: Buffer, aad: string): any {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv) as crypto.CipherGCM;
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

function decryptPayload(ciphertext: string, iv: string, authTag: string, dek: Buffer, aad: string): Buffer {
  const decipher = crypto.createDecipheriv(ALGORITHM, dek, Buffer.from(iv, 'base64')) as crypto.DecipherGCM;
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
}

async function verifyCryptoSanity() {
  console.log('--- Starting Cryptographic & DB Sanity Verification ---');
  const mekBase64 = process.env.VAULT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('base64');
  
  // Create test data
  const org = await prisma.organization.create({ data: { name: 'Test Org', slug: 'test-org-' + Date.now() } });
  const vault = await prisma.vault.create({ data: { organizationId: org.id, name: 'Sanity Vault' } });
  const keyMetadata = await prisma.keyMetadata.create({ data: { version: 1, status: 'ACTIVE' } });

  // 1. Identical plaintext -> different ciphertext, IV, authTag
  console.log('Test: Identical plaintext -> different ciphertext');
  const dek = crypto.randomBytes(32);
  const aad = JSON.stringify({ org: org.id, vault: vault.id, secret: 'fake-id', version: 1 });
  const plaintext = Buffer.from('my-super-secret');
  
  const enc1 = encryptPayload(plaintext, dek, aad);
  const enc2 = encryptPayload(plaintext, dek, aad);
  
  if (enc1.ciphertext === enc2.ciphertext) throw new Error('Ciphertexts are identical');
  if (enc1.iv === enc2.iv) throw new Error('IVs are identical');
  if (enc1.authTag === enc2.authTag) throw new Error('Auth tags are identical');
  console.log('✅ Identical plaintext check passed');

  // 2. Tampering & AAD failures
  console.log('Test: AAD and tampering checks');
  let failedAsExpected = false;
  try {
    decryptPayload(enc1.ciphertext, enc1.iv, enc1.authTag, dek, 'wrong-aad');
  } catch (e) { failedAsExpected = true; }
  if (!failedAsExpected) throw new Error('Wrong AAD should fail decryption');

  failedAsExpected = false;
  try {
    decryptPayload(enc1.ciphertext, enc1.iv, enc1.authTag, crypto.randomBytes(32), aad);
  } catch (e) { failedAsExpected = true; }
  if (!failedAsExpected) throw new Error('Wrong DEK should fail decryption');

  failedAsExpected = false;
  try {
    decryptPayload(enc1.ciphertext, enc1.iv, crypto.randomBytes(16).toString('base64'), dek, aad);
  } catch (e) { failedAsExpected = true; }
  if (!failedAsExpected) throw new Error('Tampered auth tag should fail decryption');
  console.log('✅ Cryptographic boundary checks passed');

  // Cleanup test data
  await prisma.organization.delete({ where: { id: org.id } });
  console.log('--- Verification Complete ---');
}

verifyCryptoSanity()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
