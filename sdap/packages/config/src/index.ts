// Export shared configuration constants
export const APP_NAME = "SDAP";

export const AUTH_CONFIG = {
  accessTTL: '15m',
  refreshTTL: '7d',
  issuer: 'sdap-api',
  audience: 'sdap-clients',
  algorithm: 'RS256',
  clockTolerance: 5,
  gracePeriodSeconds: 0,
} as const;
