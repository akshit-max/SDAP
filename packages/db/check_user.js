// Restored after use as migration tool.
// Re-populate as needed for diagnostics.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Add diagnostic queries here as needed
  console.log('DB connection OK');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());


const OLD_MIGRATION = '20260901000000_add_extension_session_permission';
const NEW_MIGRATION = '20260916000000_add_billing_subscription_payment';

async function main() {
  console.log('=== STEP 0: Pre-flight verification ===');

  // Verify EXTENSION already in DB
  const enumRows = await prisma.$queryRawUnsafe(
    "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='SessionPermission' ORDER BY e.enumsortorder"
  );
  const vals = enumRows.map(r => r.enumlabel);
  if (!vals.includes('EXTENSION')) {
    throw new Error('FAIL: EXTENSION not in DB — cannot proceed');
  }
  console.log('  SessionPermission enum:', vals.join(', '), '✓');

  // Verify billing tables absent
  const tableRows = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY(ARRAY['Subscription','Payment'])"
  );
  if (tableRows.length > 0) {
    console.log('  Billing tables already exist:', tableRows.map(r => r.table_name).join(', '));
    console.log('  Skipping DDL (already applied).');
    return;
  }
  console.log('  Billing tables absent — DDL safe to apply ✓');

  // ==========================================================================
  console.log('\n=== STEP 1: Mark old migration as applied ===');
  await prisma.$executeRawUnsafe(`
    UPDATE _prisma_migrations
    SET finished_at = NOW(),
        applied_steps_count = 1,
        logs = NULL
    WHERE migration_name = '${OLD_MIGRATION}'
      AND finished_at IS NULL
  `);
  const check1 = await prisma.$queryRawUnsafe(
    `SELECT finished_at FROM _prisma_migrations WHERE migration_name='${OLD_MIGRATION}'`
  );
  console.log('  finished_at:', check1[0]?.finished_at, '✓');

  // ==========================================================================
  console.log('\n=== STEP 2: Apply billing schema DDL ===');

  // Run all billing DDL in a single transaction
  await prisma.$transaction(async (tx) => {
    // Enums
    await tx.$executeRawUnsafe(`CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS')`);
    console.log('  Created enum PlanTier');

    await tx.$executeRawUnsafe(`CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL')`);
    console.log('  Created enum BillingCycle');

    await tx.$executeRawUnsafe(`CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`);
    console.log('  Created enum SubscriptionStatus');

    await tx.$executeRawUnsafe(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')`);
    console.log('  Created enum PaymentStatus');

    await tx.$executeRawUnsafe(`CREATE TYPE "PaymentType" AS ENUM ('MANDATE_REGISTRATION', 'RECURRING_EXECUTION', 'REFUND')`);
    console.log('  Created enum PaymentType');

    // Subscription table
    await tx.$executeRawUnsafe(`
      CREATE TABLE "Subscription" (
        "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "organizationId"     TEXT NOT NULL,
        "plan"               "PlanTier" NOT NULL DEFAULT 'FREE',
        "billingCycle"       "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
        "status"             "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
        "currency"           TEXT NOT NULL DEFAULT 'INR',
        "hdfcMandateId"      TEXT,
        "hdfcCustomerId"     TEXT,
        "baseAmount"         INTEGER NOT NULL DEFAULT 0,
        "extraUsers"         INTEGER NOT NULL DEFAULT 0,
        "extraUserRate"      INTEGER NOT NULL DEFAULT 0,
        "totalAmount"        INTEGER NOT NULL DEFAULT 0,
        "currentPeriodStart" TIMESTAMP(3),
        "currentPeriodEnd"   TIMESTAMP(3),
        "cancelledAt"        TIMESTAMP(3),
        "cancelReason"       TEXT,
        "failureCount"       INTEGER NOT NULL DEFAULT 0,
        "lastFailureReason"  TEXT,
        "graceUntil"         TIMESTAMP(3),
        "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"          TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('  Created table Subscription');

    // Payment table
    await tx.$executeRawUnsafe(`
      CREATE TABLE "Payment" (
        "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "subscriptionId"  TEXT NOT NULL,
        "type"            "PaymentType" NOT NULL,
        "status"          "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "hdfcOrderId"     TEXT NOT NULL,
        "hdfcTxnId"       TEXT,
        "amount"          INTEGER NOT NULL,
        "currency"        TEXT NOT NULL DEFAULT 'INR',
        "seatsAtCharge"   INTEGER NOT NULL,
        "failureCode"     TEXT,
        "failureReason"   TEXT,
        "refundedAmount"  INTEGER,
        "refundRequestId" TEXT,
        "processedAt"     TIMESTAMP(3),
        "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('  Created table Payment');

    // Unique constraints
    await tx.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_key" UNIQUE ("organizationId")`);
    await tx.$executeRawUnsafe(`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_hdfcOrderId_key" UNIQUE ("hdfcOrderId")`);
    console.log('  Added unique constraints');

    // Indexes on Subscription
    await tx.$executeRawUnsafe(`CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Subscription_hdfcMandateId_idx" ON "Subscription"("hdfcMandateId")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Subscription_status_idx" ON "Subscription"("status")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd")`);
    console.log('  Added Subscription indexes');

    // Indexes on Payment
    await tx.$executeRawUnsafe(`CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Payment_hdfcOrderId_idx" ON "Payment"("hdfcOrderId")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Payment_status_idx" ON "Payment"("status")`);
    await tx.$executeRawUnsafe(`CREATE INDEX "Payment_type_idx" ON "Payment"("type")`);
    console.log('  Added Payment indexes');

    // Foreign keys
    await tx.$executeRawUnsafe(`ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await tx.$executeRawUnsafe(`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    console.log('  Added foreign keys');
  });

  // ==========================================================================
  console.log('\n=== STEP 3: Insert billing migration record ===');
  const migrationId = crypto.randomBytes(16).toString('hex');
  await prisma.$executeRawUnsafe(`
    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES (
      '${migrationId}',
      'manual-applied-billing-schema',
      NOW(),
      '${NEW_MIGRATION}',
      NULL,
      NULL,
      NOW(),
      1
    )
  `);
  console.log('  Migration record inserted:', NEW_MIGRATION);

  // ==========================================================================
  console.log('\n=== STEP 4: Verify billing tables created ===');
  const finalCheck = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY(ARRAY['Subscription','Payment'])"
  );
  console.log('  Tables now:', finalCheck.map(r => r.table_name).join(', '));

  console.log('\n=== DONE ===');
  console.log('Run: npx prisma generate --schema packages/db/prisma/schema.prisma');
}

main()
  .catch(e => { console.error('FATAL:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
