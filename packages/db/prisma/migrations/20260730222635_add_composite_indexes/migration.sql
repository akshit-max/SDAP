-- CreateIndex
CREATE INDEX "DelegatedSession_organizationId_status_idx" ON "DelegatedSession"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DelegatedSession_granteeId_status_idx" ON "DelegatedSession"("granteeId", "status");

-- CreateIndex
CREATE INDEX "DelegatedSession_grantorId_organizationId_idx" ON "DelegatedSession"("grantorId", "organizationId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_isRevoked_idx" ON "RefreshToken"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_isRevoked_expiresAt_idx" ON "RefreshToken"("userId", "isRevoked", "expiresAt");
