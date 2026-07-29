# Production Security Release Checklist

Prior to launching the SDAP platform into a live production environment, the following security checks MUST be validated by the deployment team.

## 1. Secrets Management
- [ ] Ensure **NO secrets** (JWT secrets, DB passwords, API keys) are committed to the git repository.
- [ ] Confirm `JWT_SECRET` is a strong, cryptographically secure random string (at least 64 characters).
- [ ] Confirm `VAULT_ENCRYPTION_KEY` is a 32-byte Base64-encoded string generated from a secure random source.
- [ ] Ensure the `VAULT_ENCRYPTION_KEY` is backed up in a secure offline/KMS vault. If lost, secrets are permanently unrecoverable.

## 2. Network & Application Configuration
- [ ] Confirm `NODE_ENV=production` is set across all services (API, Web).
- [ ] Verify `CORS_ORIGIN` is strictly bound to the actual frontend domains (e.g., `https://app.example.com`). Avoid wildcard `*` in production.
- [ ] Validate API Rate Limiting is active (`@nestjs/throttler`).
- [ ] Verify HTTP Security Headers (via Helmet) are active on the API.

## 3. Logging & Auditing
- [ ] Verify application logs (stdout/stderr) do NOT contain plaintext secrets, JWTs, or passwords.
- [ ] Verify `AuditEvent` metadata payloads do not log the actual decrypted contents of a secret.
- [ ] Verify environment variables are validated strictly on startup (application should crash immediately if variables are missing or malformed).

## 4. Docker & Infrastructure
- [ ] Verify Docker images are built using non-root users (`node`/`nextjs`).
- [ ] Verify the `.dockerignore` file prevents `.env` files and source code maps from being packed into the production image.
- [ ] Ensure the PostgreSQL database is NOT exposed publicly on port 5432 outside the virtual private cloud (VPC).

## 5. Client Side (Web)
- [ ] Ensure `NEXT_TELEMETRY_DISABLED=1` is set to prevent unnecessary tracking.
- [ ] Verify that authorization JWTs are handled securely (HttpOnly cookies if configured, or stored securely in memory as per architecture).
