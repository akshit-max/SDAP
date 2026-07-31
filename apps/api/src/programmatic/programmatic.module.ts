import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VaultsModule } from '../vaults/vaults.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ProgrammaticController } from './programmatic.controller';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [PrismaModule, VaultsModule, ApiKeysModule],
  controllers: [ProgrammaticController],
  providers: [ApiKeyGuard],
})
export class ProgrammaticModule {}
