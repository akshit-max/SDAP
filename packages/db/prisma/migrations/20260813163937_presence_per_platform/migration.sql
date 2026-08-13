-- DropIndex
DROP INDEX "UserPresence_organizationId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserPresence_organizationId_userId_platform_key" ON "UserPresence"("organizationId", "userId", "platform");
