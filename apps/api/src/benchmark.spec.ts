import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EncryptionService } from './vaults/encryption.service';
import { SecretLifecycleService } from './vaults/secret-lifecycle.service';
import { VaultsService } from './vaults/vaults.service';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  avg: number;
  p95: number;
  min: number;
  max: number;
}

function calculateStats(name: string, times: number[]): BenchmarkResult {
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const p95 = times[Math.floor(times.length * 0.95)] ?? 0;
  const min = times[0] ?? 0;
  const max = times[times.length - 1] ?? 0;

  return {
    operation: name,
    avg: Number(avg.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

function printTable(results: BenchmarkResult[]) {
  console.log('\n--- Cryptographic & Operation Benchmarks ---');
  console.log(
    '| Operation                  | Avg (ms) | P95 (ms) | Min (ms) | Max (ms) |',
  );
  console.log(
    '|----------------------------|----------|----------|----------|----------|',
  );
  for (const res of results) {
    console.log(
      `| ${res.operation.padEnd(26)} | ${res.avg.toString().padEnd(8)} | ${res.p95.toString().padEnd(8)} | ${res.min.toString().padEnd(8)} | ${res.max.toString().padEnd(8)} |`,
    );
  }
  console.log(
    '------------------------------------------------------------------------\n',
  );
}

describe.skip('Cryptographic Benchmarks', () => {
  jest.setTimeout(60000); // Allow up to 60s for 100 iterations of E2E test
  it('should run benchmarks successfully', async () => {
    // Ensure we have a DB URL for testing
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is required to run end-to-end benchmarks.');
      return;
    }

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    const encryptionService = app.get(EncryptionService);
    const secretLifecycleService = app.get(SecretLifecycleService);
    const vaultsService = app.get(VaultsService);

    const ITERATIONS = 100;
    const results: BenchmarkResult[] = [];

    // Create a test organization and vault (mock values, assuming DB is accessible)
    const orgId = 'benchmark-org-' + Date.now();
    const userId = 'benchmark-user-' + Date.now();
    let vaultId = '';

    try {
      const vault = await vaultsService.createVault(orgId, userId, {
        name: 'Benchmark Vault',
        description: 'Used for benchmarking performance',
      });
      vaultId = vault.id;
    } catch (error) {
      console.error(
        'Failed to create benchmark vault. Is your database running?',
        error,
      );
      return;
    }

    const dekTimes: number[] = [];
    const encryptTimes: number[] = [];
    const decryptTimes: number[] = [];
    const createTimes: number[] = [];
    const revealTimes: number[] = [];

    // Primitive Benchmarks
    for (let i = 0; i < ITERATIONS; i++) {
      // Generate DEK
      let start = performance.now();
      const dek = encryptionService.generateDEK();
      dekTimes.push(performance.now() - start);

      const payload = Buffer.from(
        'Super secret production password that needs encryption',
        'utf8',
      );
      const context = {
        organizationId: orgId,
        vaultId,
        secretId: `test-${i}`,
        version: 1,
      };

      // Encrypt
      start = performance.now();
      const encrypted = encryptionService.encryptPayload(payload, dek, context);
      encryptTimes.push(performance.now() - start);

      // Decrypt
      start = performance.now();
      encryptionService.decryptPayload(
        encrypted.ciphertext,
        dek,
        encrypted.iv,
        encrypted.authTag,
        context,
      );
      decryptTimes.push(performance.now() - start);
    }

    // End-to-End Service Benchmarks
    const createdSecretIds: string[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      const secret = await secretLifecycleService.createSecret({
        organizationId: orgId,
        vaultId,
        userId,
        name: `Bench Secret ${i}`,
        plaintext: 'Super secret production password that needs encryption',
      });
      createTimes.push(performance.now() - start);
      createdSecretIds.push(secret.id);
    }

    for (let i = 0; i < ITERATIONS; i++) {
      const secretId = createdSecretIds[i];
      const start = performance.now();
      await secretLifecycleService.revealSecret({
        organizationId: orgId,
        secretId: secretId || '',
        userId: userId || '',
        reason: 'Benchmarking performance',
      });
      revealTimes.push(performance.now() - start);
    }

    results.push(calculateStats('DEK Generation', dekTimes));
    results.push(calculateStats('AES-256-GCM Encrypt', encryptTimes));
    results.push(calculateStats('AES-256-GCM Decrypt', decryptTimes));
    results.push(calculateStats('Secret Create (E2E)', createTimes));
    results.push(calculateStats('Secret Reveal (E2E)', revealTimes));

    printTable(results);

    // Cleanup
    await app.close();
  });
});
