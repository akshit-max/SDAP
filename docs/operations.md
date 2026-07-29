# Operations Guide

This guide is intended for DevOps and SysAdmin personnel managing the SDAP platform post-deployment.

## Environment Variables

| Variable | Description | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret used to sign Auth/Session JWTs | Yes | `(Random 64-char string)` |
| `VAULT_ENCRYPTION_KEY` | Master Encryption Key (MEK) for AES-256-GCM | Yes | `(32-byte Base64 string)` |
| `PORT` | API server port | No | `3000` |
| `NODE_ENV` | Environment mode | No | `production` |
| `CORS_ORIGIN` | Allowed Origins for API | Yes | `https://app.sdap.com` |
| `NEXT_PUBLIC_API_URL`| API URL for Web Client | Yes | `https://api.sdap.com` |

## Logging

- The platform logs directly to `stdout`/`stderr`.
- In a production Docker environment, use `docker logs <container_name>` to view logs.
- Business events are emitted asynchronously and logged to the `AuditEvent` table in the database.
- **Security Guarantee**: No plaintext secrets, JWTs, or DEKs are written to application logs or the `AuditEvent` metadata payload.

## Backup & Restore

### Database
SDAP relies heavily on PostgreSQL for state, including encrypted secrets.
- **Backup**: Use `pg_dump` daily.
  ```bash
  pg_dump -U sdap_user -d sdap_db -F c -f /backups/sdap_db_$(date +%F).dump
  ```
- **Restore**: Use `pg_restore`.

### Vault Encryption Key (MEK)
**CRITICAL**: The `VAULT_ENCRYPTION_KEY` is not stored in the database. If this environment variable is lost, **all secrets become permanently inaccessible**. Store this key securely in an external vault (e.g., AWS KMS, HashiCorp Vault).

## Troubleshooting

- **500 Errors on Secret Reveal**: Verify `VAULT_ENCRYPTION_KEY` matches the key used to originally encrypt the data.
- **Login Failures**: Check Redis (if configured for sessions/throttling) or ensure `JWT_SECRET` has not been rotated abruptly.
- **High Latency**: The `/health` endpoint exposes memory and DB connectivity metrics. Utilize APM tools (e.g., Datadog, New Relic) for deeper tracing.
