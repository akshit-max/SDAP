import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './audit.service';
import { AuditListenerService } from './audit-listener.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [AuditController],
  providers: [AuditService, AuditListenerService],
  exports: [AuditService],
})
export class AuditModule {}
