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
import { GmailAdapter } from './gmail/gmail.adapter';
import { GmailOtpService } from './gmail/gmail-otp.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, VaultsModule, ConfigModule],
  providers: [
    // Core framework
    IntegrationRegistry,
    IntegrationEncryptionService,
    IntegrationsService,
    // Provider adapters
    VercelAdapter,
    GitHubAdapter,
    GoDaddyAdapter,
    GmailAdapter,
    GmailOtpService,
  ],
  controllers: [IntegrationsController],
  exports: [IntegrationsService, GmailAdapter, GmailOtpService],
})
export class IntegrationsModule implements OnModuleInit {
  constructor(
    private readonly registry: IntegrationRegistry,
    private readonly vercel: VercelAdapter,
    private readonly github: GitHubAdapter,
    private readonly godaddy: GoDaddyAdapter,
    private readonly gmail: GmailAdapter,
  ) {}

  /**
   * Register all adapters at startup.
   * To add a new provider: implement IIntegrationAdapter, inject it here, call registerAdapter.
   */
  onModuleInit() {
    this.registry.registerAdapter(this.vercel);
    this.registry.registerAdapter(this.github);
    this.registry.registerAdapter(this.godaddy);
    this.registry.registerAdapter(this.gmail);
  }
}
