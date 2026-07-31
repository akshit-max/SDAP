# WITHUS Deployment Checklist

This document serves as the official deployment checklist for running the WITHUS platform in production environments (e.g., Kubernetes, Render, Fly.io).

## Prerequisites

Before deploying, ensure you have the following environment variables configured in your secrets manager or environment configuration:

### Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Must be set to `production` | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `VAULT_ENCRYPTION_KEY` | Master encryption key (exactly 32+ characters) | `e2a4...` |
| `REDIS_URL` | Redis connection string (Required for rate limiting/caching) | `redis://redis:6379` |
| `SMTP_HOST` | SMTP server host | `smtp.mailgun.org` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `postmaster@domain.com` |
| `SMTP_PASS` | SMTP password | `password` |

### Optional but Recommended
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`: If not provided via env, they must be mounted as files into `/app/keys/private.pem` and `/app/keys/public.pem`.

## Build Instructions

WITHUS uses Turborepo for efficient monorepo builds. The Dockerfiles already implement the recommended `turbo prune --docker` pattern.

**To build the API:**
```bash
docker build -f apps/api/Dockerfile -t withus-api:latest .
```

**To build the Web Dashboard:**
```bash
docker build -f apps/web/Dockerfile -t withus-web:latest .
```

## Runtime Expectations

### API Container
- **Port:** The API exposes port `4000` internally.
- **Health Check:** `GET /api/health`
- **Swagger UI:** Available at `/api/docs` (only if exposed, typically protected or disabled externally).
- **Startup:** If any required environment variable is missing, the API will "fail fast" and crash immediately with an error log.

### Web Container
- **Port:** The Next.js standalone server exposes port `3000` internally.
- **Health Check:** `GET /` (or any valid page).
- **Prisma Engine:** The web container requires the Prisma query engine to type-check and execute certain Next.js server actions. This is handled automatically by the Dockerfile.

## Common Failures

1. **`Environment validation error: ...` on API startup**
   - **Cause:** You missed configuring a required variable like `REDIS_URL` or `SMTP_HOST`.
   - **Fix:** Update your environment config and restart.
2. **`PrismaClientInitializationError: Can't reach database server`**
   - **Cause:** The `DATABASE_URL` is incorrect or the database is inaccessible from the container.
   - **Fix:** Verify network policies and credentials.
3. **Web container crash: `Cannot find module '.prisma/client'`**
   - **Cause:** Standalone Next.js failed to copy the generated Prisma client.
   - **Fix:** Ensure the Web Dockerfile's `COPY --from=builder ... .prisma` step executes correctly.

## Rollback Procedure

Since WITHUS follows immutable infrastructure principles:
1. Revert to the previously known-good Docker image tag (e.g., `v0.9.1-prod-foundation`).
2. If a Prisma migration was applied and needs reverting, you must restore the database from a backup or run a down migration *before* rolling back the application code. (Note: Forward-only migrations are highly recommended).
