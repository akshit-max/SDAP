import type { PlatformConfig } from '../lib/types';

/**
 * V2 Platform Registry
 * Manages all supported platforms declaratively.
 */
export class PlatformRegistry {
  private configs: Map<string, PlatformConfig> = new Map();

  register(config: PlatformConfig) {
    this.configs.set(config.id, config);
  }

  getForHost(hostname: string): PlatformConfig | null {
    for (const config of this.configs.values()) {
      for (const domain of config.domains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return config;
        }
      }
    }
    return null;
  }

  getAll(): PlatformConfig[] {
    return Array.from(this.configs.values());
  }
}

export const platformRegistry = new PlatformRegistry();
