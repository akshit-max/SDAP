import { Module, forwardRef } from '@nestjs/common';
import { SessionsController } from './controllers/sessions.controller';
import { GlobalSessionsController } from './controllers/global-sessions.controller';
import { SessionsService, INTEGRATIONS_SERVICE_TOKEN } from './sessions.service';
import { SessionValidationService } from './session-validation.service';
import { SessionExpiryScheduler } from './session-expiry.scheduler';
import { VaultsModule } from '../vaults/vaults.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { IntegrationsService } from '../integrations/integrations.service';

@Module({
  imports: [
    PrismaModule,
    VaultsModule,
    AuthorizationModule,
    forwardRef(() => ApprovalsModule),
    forwardRef(() => IntegrationsModule),
  ],
  controllers: [SessionsController, GlobalSessionsController],
  providers: [
    SessionsService,
    SessionValidationService,
    SessionExpiryScheduler,
    {
      provide: INTEGRATIONS_SERVICE_TOKEN,
      useExisting: IntegrationsService,
    },
  ],
  exports: [SessionsService, SessionValidationService],
})
export class SessionsModule {}
