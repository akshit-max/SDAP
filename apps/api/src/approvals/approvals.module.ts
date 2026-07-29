import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalPolicyService } from './approval-policy.service';
import { SessionsModule } from '../sessions/sessions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
    forwardRef(() => SessionsModule),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalPolicyService],
  exports: [ApprovalsService, ApprovalPolicyService],
})
export class ApprovalsModule {}
