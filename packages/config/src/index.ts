// Export shared configuration constants
export const APP_NAME = "SDAP";

export const AUTH_CONFIG = {
  accessTTL: '1h',
  refreshTTL: '7d',
  issuer: 'sdap-api',
  audience: 'sdap-clients',
  algorithm: 'RS256',
  clockTolerance: 5,
  gracePeriodSeconds: 0,
} as const;

export const ORG_CONFIG = {
  INVITATION_TTL: "7d", // Invitations expire in 7 days
  MAX_ORGS_PER_USER: 10,
} as const;
