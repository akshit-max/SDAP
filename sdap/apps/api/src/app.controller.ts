import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async getReady(): Promise<{ status: string; checks: any }> {
    const checks: any = {};
    let isReady = true;

    // 1. Prisma / PostgreSQL Check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch (e) {
      this.logger.error('Database readiness check failed', e);
      checks.database = 'down';
      isReady = false;
    }

    // 2. Redis Check
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
      await redis.ping();
      redis.disconnect();
      checks.redis = 'up';
    } catch (e) {
      this.logger.error('Redis readiness check failed', e);
      checks.redis = 'down';
      isReady = false;
    }

    // 3. JWT Keys Check
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const publicKey = this.configService.get<string>('JWT_PUBLIC_KEY');
      if (!publicKey && !isProd) {
        const rootDir = process.cwd();
        if (!existsSync(join(rootDir, 'keys', 'public.pem'))) {
          throw new Error('Missing keys/public.pem');
        }
      } else if (!publicKey && isProd) {
        throw new Error('JWT_PUBLIC_KEY is required in production');
      }
      checks.jwt = 'loaded';
    } catch (e) {
      this.logger.error('JWT keys check failed', e);
      checks.jwt = 'missing';
      isReady = false;
    }

    // 4. Env Validation
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (!dbUrl) {
      checks.env = 'invalid';
      isReady = false;
    } else {
      checks.env = 'valid';
    }

    if (!isReady) {
      throw new ServiceUnavailableException({
        status: 'error',
        checks,
      });
    }

    return {
      status: 'ready',
      checks,
    };
  }
}
