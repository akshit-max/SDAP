import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

/**
 * RedisThrottlerStorage
 *
 * Implements the @nestjs/throttler v6 ThrottlerStorage interface using ioredis.
 * Provides shared rate-limit counters across multiple API instances on Render.
 *
 * Only instantiated when REDIS_URL is set. When absent, ThrottlerModule
 * uses the default in-memory ThrottlerStorageService (existing behavior).
 *
 * Atomic behavior: hit-count increment and TTL assignment use a Lua script
 * to prevent race conditions across concurrent requests from multiple instances.
 *
 * Key structure in Redis:
 *   throttler:<throttlerName>:<key>:hits  → integer hit counter (with TTL)
 *   throttler:<throttlerName>:<key>:block → "1" if IP is currently blocked (with blockDuration TTL)
 *
 * Fail-closed: if Redis is unavailable, ioredis rejects the promise and
 * ThrottlerGuard propagates the error — the request is NOT passed through.
 *
 * DO NOT modify: the return shape { totalHits, timeToExpire, isBlocked,
 * timeToBlockExpire } is read directly by ThrottlerGuard to allow/reject.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly client: Redis;

  /**
   * Atomic Lua script: increment counter, set TTL on first hit.
   * Returns [totalHits, remainingPttl]
   */
  private static readonly LUA_INCREMENT = `
    local key = KEYS[1]
    local ttl = tonumber(ARGV[1])
    local current = redis.call('INCR', key)
    if current == 1 then
      redis.call('PEXPIRE', key, ttl)
    end
    local pttl = redis.call('PTTL', key)
    return {current, pttl}
  `;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });

    this.client.on('error', (err) => {
      // Log to console — do not swallow. The next increment() call will
      // reject and ThrottlerGuard will throw, which is fail-closed behavior.
      console.error(
        '[RedisThrottlerStorage] Redis connection error:',
        err.message,
      );
    });
  }

  async increment(
    key: string,
    ttl: number, // milliseconds — v6 passes ms
    limit: number,
    blockDuration: number, // milliseconds
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const hitsKey = `throttler:${throttlerName}:${key}:hits`;
    const blockKey = `throttler:${throttlerName}:${key}:block`;

    // ── 1. Check if IP is currently blocked ──────────────────────────────────
    const blockPttl = await this.client.pttl(blockKey);
    if (blockPttl > 0) {
      // Blocked: return current state without incrementing counter
      const hitsPttl = await this.client.pttl(hitsKey);
      const currentHits = await this.client.get(hitsKey);
      return {
        totalHits: currentHits ? parseInt(currentHits, 10) : limit + 1,
        timeToExpire: hitsPttl > 0 ? Math.ceil(hitsPttl / 1000) : 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockPttl / 1000),
      };
    }

    // ── 2. Atomically increment hit counter ──────────────────────────────────
    const result = (await this.client.eval(
      RedisThrottlerStorage.LUA_INCREMENT,
      1,
      hitsKey,
      ttl,
    )) as [number, number];

    const totalHits = result[0];
    const remainingPttl = result[1];
    const timeToExpire =
      remainingPttl > 0 ? Math.ceil(remainingPttl / 1000) : 0;

    // ── 3. Apply block if limit exceeded ─────────────────────────────────────
    let isBlocked = false;
    let timeToBlockExpire = 0;

    if (totalHits > limit) {
      // NX: only set if not already blocked (avoids resetting block timer on each hit)
      await this.client.set(blockKey, '1', 'PX', blockDuration, 'NX');
      const blockRemainingMs = await this.client.pttl(blockKey);
      isBlocked = true;
      timeToBlockExpire =
        blockRemainingMs > 0 ? Math.ceil(blockRemainingMs / 1000) : 0;
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
