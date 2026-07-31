import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import { IIntegrationAdapter } from './integration-adapter.interface';

/**
 * IntegrationRegistry holds all registered provider adapters.
 * Adapters are registered at module startup via registerAdapter().
 * The IntegrationsService resolves the correct adapter for any operation.
 *
 * Adding a new provider = implementing IIntegrationAdapter + calling registerAdapter().
 * No changes to business logic required.
 */
@Injectable()
export class IntegrationRegistry {
  private readonly logger = new Logger(IntegrationRegistry.name);
  private readonly adapters = new Map<IntegrationProvider, IIntegrationAdapter>();

  registerAdapter(adapter: IIntegrationAdapter): void {
    this.adapters.set(adapter.provider, adapter);
    this.logger.log(`Registered integration adapter: ${adapter.provider}`);
  }

  getAdapter(provider: IntegrationProvider): IIntegrationAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new NotFoundException(
        `No integration adapter registered for provider: ${provider}`,
      );
    }
    return adapter;
  }

  getSupportedProviders(): IntegrationProvider[] {
    return Array.from(this.adapters.keys());
  }
}
