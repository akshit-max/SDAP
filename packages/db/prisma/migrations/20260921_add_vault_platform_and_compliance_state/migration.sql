-- Migration: add_vault_platform_and_compliance_state
-- Adds Vault.platformId (nullable, additive) and Subscription compliance fields
-- Existing rows: ComplianceState defaults to COMPLIANT (preserves existing orgs)
-- New FREE orgs: set PLATFORM_SELECTION_REQUIRED explicitly in SubscriptionService.getOrCreate()

DO $$ BEGIN
  CREATE TYPE "ComplianceState" AS ENUM (
    'COMPLIANT',
    'PLATFORM_SELECTION_REQUIRED',
    'TEAM_CLEANUP_REQUIRED',
    'UPGRADE_PROMPT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "complianceState" "ComplianceState" NOT NULL DEFAULT 'COMPLIANT';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "selectedPlatforms" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "selectionLockedUntil" TIMESTAMP;

ALTER TABLE "Vault" ADD COLUMN IF NOT EXISTS "platformId" TEXT;