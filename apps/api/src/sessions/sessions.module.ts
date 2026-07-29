import { Module, forwardRef } from '@nestjs/common';
import { SessionsController } from './controllers/sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionValidationService } from './session-validation.service';
import { VaultsModule } from '../vaults/vaults.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [
    PrismaModule,
    VaultsModule,
    AuthorizationModule,
    forwardRef(() => ApprovalsModule),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionValidationService],
  exports: [SessionsService, SessionValidationService],
})
export class SessionsModule {}
