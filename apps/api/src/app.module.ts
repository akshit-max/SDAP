import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { OrganizationsModule } from './organizations/organizations.module';

import { ConfigModule } from '@nestjs/config';
import { AuthorizationModule } from './authorization/authorization.module';
import { VaultsModule } from './vaults/vaults.module';
import { SessionsModule } from './sessions/sessions.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ProgrammaticModule } from './programmatic/programmatic.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { RedisThrottlerStorage } from './common/storage/redis-throttler.storage';

import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot({
      // Global default: 10 req / 60s per IP.
      // Per-route overrides via @Throttle decorator are unaffected.
      throttlers: [{ ttl: 60000, limit: 10 }],
      // When REDIS_URL is set: use Redis-backed shared storage so counters
      // are consistent across multiple Render instances (production).
      // When REDIS_URL is absent: storage is undefined → ThrottlerModule uses
      // its default in-memory ThrottlerStorageService (existing local dev behavior).
      storage: process.env.REDIS_URL
        ? new RedisThrottlerStorage(process.env.REDIS_URL)
        : undefined,
    }),

    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    PrismaModule,
    OrganizationsModule,
    AuthorizationModule,
    VaultsModule,
    SessionsModule,
    ApprovalsModule,
    AuditModule,
    HealthModule,
    NotificationsModule,
    IntegrationsModule,
    ApiKeysModule,
    ProgrammaticModule,
    WebhooksModule,
    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
