import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Helpers to deserialize/serialize DEK (duplicated from SecretLifecycleService to keep script standalone)
function deserializeDek(serialized: string): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
  const parts = serialized.split('.');
  if (parts.length !== 3) throw new Error('Corrupted DEK format');
  return {
    iv: Buffer.from(parts[0]!, 'base64'),
    authTag: Buffer.from(parts[1]!, 'base64'),
    ciphertext: Buffer.from(parts[2]!, 'base64'),
  };
}

function serializeDek(iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
}

function computeFingerprint(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function rewrapDEK(
  encryptedDek: Buffer,
  iv: Buffer,
  authTag: Buffer,
  oldMek: Buffer,
  newMek: Buffer,
) {
  let dek: Buffer;
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, oldMek, iv);
    decipher.setAuthTag(authTag);
    dek = Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
  } catch {
    throw new Error('Failed to decrypt DEK with old MEK');
  }

  if (dek.length !== 32) {
    throw new Error('Invalid DEK length after decryption');
  }

  const newIv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, newMek, newIv);

  const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
  const newAuthTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: newIv,
    authTag: newAuthTag,
    fingerprint: computeFingerprint(dek),
  };
}

async function main() {
  console.log('--- WITHUS MEK Rotation Utility ---');
  
  const oldMekBase64 = process.env.VAULT_ENCRYPTION_KEY;
  if (!oldMekBase64) {
    console.error('ERROR: VAULT_ENCRYPTION_KEY environment variable is missing.');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: npm run rotate-mek <new_base64_key>');
    process.exit(1);
  }
  
  const newMekBase64 = args[0]!;
  if (oldMekBase64 === newMekBase64) {
    console.error('ERROR: New key is the same as the old key.');
    process.exit(1);
  }
  
  const oldMek = Buffer.from(oldMekBase64, 'base64');
  const newMek = Buffer.from(newMekBase64, 'base64');
  
  if (oldMek.length !== 32 || newMek.length !== 32) {
    console.error('ERROR: Both keys must be valid 256-bit (32 byte) keys encoded in Base64.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // 1. Find the current ACTIVE key (the old key)
    const oldKey = await prisma.keyMetadata.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });
    
    if (!oldKey) {
      console.error('ERROR: No ACTIVE key found in database.');
      process.exit(1);
    }
    
    // 2. Find or create the NEW key
    let newKey = await prisma.keyMetadata.findFirst({
      where: { version: oldKey.version + 1 },
    });
    
    if (!newKey) {
      console.log(`Creating new KeyMetadata version ${oldKey.version + 1}...`);
      // Use ACTIVE status because schema doesn't have ROTATING.
      // We know which one is newer by version number.
      newKey = await prisma.keyMetadata.create({
        data: {
          version: oldKey.version + 1,
          algorithm: 'AES-256-GCM',
          status: 'ACTIVE',
        },
      });
    } else {
      console.log(`Resuming rotation for KeyMetadata version ${newKey.version}...`);
    }

    // 3. Process Secrets in Batches
    const BATCH_SIZE = 100;
    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      // Find secrets that are still using the old key
      const secrets = await prisma.secret.findMany({
        where: { keyMetadataId: oldKey.id },
        take: BATCH_SIZE,
      });

      if (secrets.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch of ${secrets.length} secrets...`);

      // Process the batch in a transaction
      await prisma.$transaction(async (tx) => {
        for (const secret of secrets) {
          try {
            const dekParts = deserializeDek(secret.encryptedDek);
            const rewrapped = rewrapDEK(
              dekParts.ciphertext,
              dekParts.iv,
              dekParts.authTag,
              oldMek,
              newMek
            );
            
            const newSerializedDek = serializeDek(rewrapped.iv, rewrapped.authTag, rewrapped.ciphertext);

            // Update Secret
            await tx.secret.update({
              where: { id: secret.id },
              data: {
                encryptedDek: newSerializedDek,
                keyMetadataId: newKey.id, // Update relation to new key
              },
            });
            
            // Also update SecretVersion references for consistency
            await tx.secretVersion.updateMany({
              where: { secretId: secret.id, keyMetadataId: oldKey.id },
              data: { keyMetadataId: newKey.id },
            });
            
          } catch (err) {
            console.error(`Failed to rewrap secret ${secret.id}. Error:`, err);
            throw err; // Rollback transaction
          }
        }
      });

      processedCount += secrets.length;
      console.log(`Successfully migrated ${processedCount} secrets so far.`);
    }

    console.log('All secrets migrated successfully.');

    // 4. Mark old key as ROTATED
    console.log('Marking old key as ROTATED...');
    await prisma.keyMetadata.update({
      where: { id: oldKey.id },
      data: { status: 'ROTATED', rotatedAt: new Date() },
    });

    console.log('✅ MEK Rotation Complete!');
    console.log('IMPORTANT: You must now update the VAULT_ENCRYPTION_KEY environment variable to the new key and restart the application.');
    
  } catch (error) {
    console.error('Rotation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
