import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from './encryption.service';
import { SecretLifecycleService } from './secret-lifecycle.service';
import { VaultsService } from './vaults.service';
import { VaultsController } from './controllers/vaults.controller';
import { SecretsController } from './controllers/secrets.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, BillingModule],
  providers: [EncryptionService, SecretLifecycleService, VaultsService],
  controllers: [VaultsController, SecretsController],
  exports: [VaultsService, SecretLifecycleService, EncryptionService],
})
export class VaultsModule {}
