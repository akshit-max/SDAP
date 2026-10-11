import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  let storage: RedisThrottlerStorage;
  let mockRedisClient: any;

  beforeEach(() => {
    storage = new RedisThrottlerStorage('redis://localhost:6379');
    mockRedisClient = (storage as any).client;
  });

  afterEach(() => {
    if (mockRedisClient && typeof mockRedisClient.disconnect === 'function') {
      try {
        mockRedisClient.disconnect();
      } catch {}
    }
  });

  describe('Normal Redis operation', () => {
    it('should increment and return counts when under limit', async () => {
      jest.spyOn(mockRedisClient, 'pttl').mockResolvedValue(-2);
      jest.spyOn(mockRedisClient, 'eval').mockResolvedValue([1, 60000]);

      const result = await storage.increment(
        '127.0.0.1',
        60000,
        10,
        60000,
        'default',
      );

      expect(result).toEqual({
        totalHits: 1,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
    });

    it('should detect when an IP is already blocked in Redis', async () => {
      jest.spyOn(mockRedisClient, 'pttl').mockResolvedValue(30000);
      jest.spyOn(mockRedisClient, 'get').mockResolvedValue('15');

      const result = await storage.increment(
        '127.0.0.1',
        60000,
        10,
        60000,
        'default',
      );

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(15);
      expect(result.timeToBlockExpire).toBe(30);
    });

    it('should set block key when limit is exceeded', async () => {
      jest
        .spyOn(mockRedisClient, 'pttl')
        .mockResolvedValueOnce(-2) // block check
        .mockResolvedValueOnce(60000); // after set block
      jest.spyOn(mockRedisClient, 'eval').mockResolvedValue([11, 60000]);
      const setSpy = jest.spyOn(mockRedisClient, 'set').mockResolvedValue('OK');

      const result = await storage.increment(
        '127.0.0.1',
        60000,
        10,
        60000,
        'default',
      );

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(11);
      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe('Cold-boot & resilience fallback (when Redis is down / timing out)', () => {
    it('should gracefully fall back to in-memory rate limiting when Redis rejects', async () => {
      jest
        .spyOn(mockRedisClient, 'pttl')
        .mockRejectedValue(new Error('Connection is closed'));

      const result1 = await storage.increment(
        'cold-boot-ip',
        60000,
        5,
        60000,
        'default',
      );
      expect(result1.totalHits).toBe(1);
      expect(result1.isBlocked).toBe(false);

      const result2 = await storage.increment(
        'cold-boot-ip',
        60000,
        5,
        60000,
        'default',
      );
      expect(result2.totalHits).toBe(2);
      expect(result2.isBlocked).toBe(false);
    });

    it('should enforce in-memory limit when Redis fails during heavy requests', async () => {
      jest
        .spyOn(mockRedisClient, 'pttl')
        .mockRejectedValue(new Error('ETIMEDOUT'));

      for (let i = 1; i <= 3; i++) {
        const res = await storage.increment(
          'spammer-ip',
          60000,
          3,
          60000,
          'default',
        );
        expect(res.totalHits).toBe(i);
        expect(res.isBlocked).toBe(false);
      }

      // 4th hit should be blocked
      const blockedRes = await storage.increment(
        'spammer-ip',
        60000,
        3,
        60000,
        'default',
      );
      expect(blockedRes.isBlocked).toBe(true);
      expect(blockedRes.totalHits).toBe(4);
    });
  });
});
