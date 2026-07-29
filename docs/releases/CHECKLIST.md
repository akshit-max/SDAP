# SDAP Release Checklist

This checklist must be fully verified and checked off before tagging any production release. It guarantees that both automated checks and manual live-environment validations have been satisfied.

## 1. Automated Validation (Fast CI)
- [ ] **Build:** `npm run build` is green across all packages.
- [ ] **Lint:** `npm run lint` completes without blocking errors.
- [ ] **Typecheck:** `npm run check-types` is green across all packages.
- [ ] **Unit Tests:** `npm run test` is green for all test suites.
- [ ] **Prisma Validation:** `npx prisma validate` confirms the schema is valid and migrations are aligned.

## 2. Heavy Release Validation
- [ ] **Workflow Execution:** `release-validation.yml` triggered manually or via PR.
- [ ] **PostgreSQL Container:** Database service successfully provisions.
- [ ] **Prisma Push/Migrate:** Database schema applied successfully to the fresh container.
- [ ] **Cryptographic Verification:** `verify-crypto.ts` script passes against the live database.
- [ ] **E2E Integration:** `vaults.e2e-spec.ts` passes against the live environment.

## 3. Manual Live Environment Smoke Test
- [ ] **Execution:** `manual-vault-smoke.sh` executed against the target environment (e.g., local dev or staging).
- [ ] **Verification:** HTTP status codes return exactly as expected (e.g., 201s for creation, 404/500s for deleted access).
- [ ] **Security:** Reveal endpoints reject unauthorized access and cross-tenant requests.

## 4. Live Database Inspection
- [ ] **Data Sanitization:** Verify **zero plaintext** secrets are stored in the database.
- [ ] **Immutability:** Verify `SecretVersion` rows cannot be overwritten.
- [ ] **Key Integrity:** Encrypted DEKs and KeyMetadata are correctly associated.
- [ ] **Soft Deletes:** `deletedAt` is correctly populated for removed vaults/secrets.

## 5. Security & Operational Readiness
- [ ] **Secrets Audit:** No `.env` files or raw keys committed to the repository.
- [ ] **Dependency Audit:** Known vulnerabilities reviewed and patched if affecting the deployment target.
- [ ] **Log Sanitization:** Application logs verified to contain no plaintext or decrypted values.

## 6. Release Finalization
- [ ] **Release Notes:** `docs/releases/vX.X.X.md` baseline document is completed, replacing all ⏳ with ✅.
- [ ] **Git Tag:** Tag created (e.g., `git tag -a v0.5.0-vault -m "Release v0.5.0"`).
- [ ] **GitHub Release:** Tag pushed and GitHub Release created from the baseline document.
