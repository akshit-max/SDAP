const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const statements = [
    `CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS')`,
    `CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL')`,
    `CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`,
    `CREATE TYPE "PaymentType" AS ENUM ('MANDATE_REGISTRATION', 'RECURRING_EXECUTION', 'REFUND')`,
    `CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')`,
    `CREATE TABLE "Subscription" (
        "id" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
        "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
        "status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
        "currency" TEXT NOT NULL DEFAULT 'INR',
        "hdfcMandateId" TEXT,
        "hdfcCustomerId" TEXT,
        "baseAmount" INTEGER NOT NULL DEFAULT 0,
        "extraUsers" INTEGER NOT NULL DEFAULT 0,
        "extraUserRate" INTEGER NOT NULL DEFAULT 0,
        "totalAmount" INTEGER NOT NULL DEFAULT 0,
        "currentPeriodStart" TIMESTAMP(3),
        "currentPeriodEnd" TIMESTAMP(3),
        "cancelledAt" TIMESTAMP(3),
        "cancelReason" TEXT,
        "failureCount" INTEGER NOT NULL DEFAULT 0,
        "lastFailureReason" TEXT,
        "graceUntil" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "subscriptionId" TEXT NOT NULL,
        "type" "PaymentType" NOT NULL,
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "hdfcOrderId" TEXT NOT NULL,
        "hdfcTxnId" TEXT,
        "amount" INTEGER NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'INR',
        "seatsAtCharge" INTEGER NOT NULL DEFAULT 0,
        "failureCode" TEXT,
        "failureReason" TEXT,
        "refundedAmount" INTEGER,
        "refundRequestId" TEXT,
        "processedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId")`,
    `CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId")`,
    `CREATE INDEX "Subscription_hdfcMandateId_idx" ON "Subscription"("hdfcMandateId")`,
    `CREATE INDEX "Subscription_status_idx" ON "Subscription"("status")`,
    `CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd")`,
    `CREATE UNIQUE INDEX "Payment_hdfcOrderId_key" ON "Payment"("hdfcOrderId")`,
    `CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId")`,
    `CREATE INDEX "Payment_hdfcOrderId_idx" ON "Payment"("hdfcOrderId")`,
    `CREATE INDEX "Payment_status_idx" ON "Payment"("status")`,
    `CREATE INDEX "Payment_type_idx" ON "Payment"("type")`,
    `ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE`
  ];
  for (const s of statements) {
    try {
      await prisma.$executeRawUnsafe(s);
    } catch (e) {
      console.log("Ignored or already exists:", e.message);
    }
  }
  console.log("DDL Complete");
}
run().finally(() => prisma.$disconnect());
