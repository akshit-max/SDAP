import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from './encryption.service';
import { SecretLifecycleService } from './secret-lifecycle.service';
import { VaultsService } from './vaults.service';
import { VaultsController } from './controllers/vaults.controller';
import { SecretsController } from './controllers/secrets.controller';

@Module({
  imports: [PrismaModule],
  providers: [EncryptionService, SecretLifecycleService, VaultsService],
  controllers: [VaultsController, SecretsController],
  exports: [VaultsService, SecretLifecycleService],
})
export class VaultsModule {}
