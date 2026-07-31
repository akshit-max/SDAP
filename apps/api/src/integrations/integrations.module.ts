import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VaultsModule } from '../vaults/vaults.module';

// Core
import { IntegrationRegistry } from './core/integration-registry.service';
import { IntegrationEncryptionService } from './core/integration-encryption.service';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';

// Adapters
import { VercelAdapter } from './vercel/vercel.adapter';
import { GitHubAdapter } from './github/github.adapter';
import { GoDaddyAdapter } from './godaddy/godaddy.adapter';

@Module({
  imports: [PrismaModule, VaultsModule],
  providers: [
    // Core framework
    IntegrationRegistry,
    IntegrationEncryptionService,
    IntegrationsService,
    // Provider adapters
    VercelAdapter,
    GitHubAdapter,
    GoDaddyAdapter,
  ],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule implements OnModuleInit {
  constructor(
    private readonly registry: IntegrationRegistry,
    private readonly vercel: VercelAdapter,
    private readonly github: GitHubAdapter,
    private readonly godaddy: GoDaddyAdapter,
  ) {}

  /**
   * Register all adapters at startup.
   * To add a new provider: implement IIntegrationAdapter, inject it here, call registerAdapter.
   */
  onModuleInit() {
    this.registry.registerAdapter(this.vercel);
    this.registry.registerAdapter(this.github);
    this.registry.registerAdapter(this.godaddy);
  }
}
