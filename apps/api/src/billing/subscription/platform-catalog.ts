/**
 * WITHUS Vault Platform Catalog
 *
 * Authoritative list of 11 Vault platform identifiers for the
 * Free-plan platform entitlement system.
 *
 * IMPORTANT: This catalog is for Vault credential entitlement ONLY.
 * It does NOT modify, extend, or replace IntegrationProvider.
 * The 7 platforms without native integration implementations (LinkedIn,
 * Shopify, Stripe, Razorpay, MCA, GST, Udyam) remain as Vault-only
 * platforms -- no fake integrations are created for them.
 */
export const WITHUS_VAULT_PLATFORMS = [
  'GITHUB',
  'VERCEL',
  'GODADDY',
  'LINKEDIN',
  'SHOPIFY',
  'STRIPE',
  'RAZORPAY',
  'MCA',
  'GST',
  'UDYAM',
  'GMAIL',
] as const;

export type VaultPlatformId = (typeof WITHUS_VAULT_PLATFORMS)[number];

/**
 * Returns true if the given string is a valid WITHUS Vault platform ID.
 */
export function isValidVaultPlatformId(
  value: unknown,
): value is VaultPlatformId {
  return (
    typeof value === 'string' &&
    (WITHUS_VAULT_PLATFORMS as readonly string[]).includes(value)
  );
}
