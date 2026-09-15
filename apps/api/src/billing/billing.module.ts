import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRenewalScheduler } from './billing.renewal.scheduler';
import { HdfcGatewayService } from './hdfc/hdfc-gateway.service';
import { HdfcSignatureService } from './hdfc/hdfc-signature.service';
import { HdfcWebhookGuard } from './hdfc/hdfc-webhook.guard';
import { SubscriptionService } from './subscription/subscription.service';
import { EntitlementService } from './subscription/entitlement.service';

/**
 * BillingModule
 *
 * Self-contained module for all billing functionality.
 * Registered in AppModule — zero changes to any other existing module.
 *
 * Dependencies:
 *   - PrismaModule   (database access via PrismaService)
 *   - HttpModule     (outbound HTTP to HDFC API via @nestjs/axios)
 *   - ConfigModule   (HDFC env vars via ConfigService)
 *   - ScheduleModule (already registered globally in AppModule)
 *   - EventEmitter   (already registered globally in AppModule)
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule, // For ConfigService in all billing services
  ],
  controllers: [BillingController],
  providers: [
    // HDFC infrastructure
    HdfcGatewayService,
    HdfcSignatureService,
    HdfcWebhookGuard,
    // Subscription CRUD and entitlements
    SubscriptionService,
    EntitlementService,
    // Core billing orchestration
    BillingService,
    // Renewal scheduler
    BillingRenewalScheduler,
  ],
  exports: [
    // Export for future use by other modules (e.g. a future entitlement guard)
    EntitlementService,
    SubscriptionService,
  ],
})
export class BillingModule {}
