# WITHUS Database Backup and Restore Guide

This document outlines how to manage PostgreSQL backups for the WITHUS platform. 

The strategy utilizes a portable `backup.sh` script that leverages `pg_dump` to generate custom-format (`.dump`) backups. These backups compress data effectively and allow for flexible restoration options (e.g., parallel restore or selective table restoration).

## Configuration

The backup script (`docker/scripts/backup.sh`) supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKUP_DIR` | Directory where backups are stored | `./backups` |
| `RETENTION_DAYS` | Number of days to keep old backups | `7` |
| `DATABASE_URL` | Full PostgreSQL connection string (preferred) | - |
| `POSTGRES_HOST` | Database host (if `DATABASE_URL` is omitted) | - |
| `POSTGRES_USER` | Database user (if `DATABASE_URL` is omitted) | - |
| `POSTGRES_PASSWORD` | Database password (if `DATABASE_URL` is omitted) | - |
| `POSTGRES_DB` | Database name (if `DATABASE_URL` is omitted) | - |

---

## 1. Creating a Backup

### Using Docker (Recommended for Production)

If your database is running in a Docker container (e.g., `db` service), you can execute the backup script directly using a temporary PostgreSQL container attached to the same network.

Run this from the project root:

```bash
docker run --rm \
  --network withus_default \
  -v $(pwd)/docker/scripts:/scripts \
  -v $(pwd)/backups:/backups \
  -e BACKUP_DIR=/backups \
  -e DATABASE_URL="postgresql://withus:withus_password@db:5432/withus_db" \
  postgres:15-alpine /scripts/backup.sh
```
*Note: Replace `--network withus_default` with the actual network name of your compose stack (run `docker network ls` to verify).*

### Running Manually on Host

If `pg_dump` is installed on your host system:

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sdap"
./docker/scripts/backup.sh
```

---

## 2. Restoring a Backup

Backups are created in the custom PostgreSQL format (`-Fc`). You must use `pg_restore` to restore them.

**WARNING: Restoring will overwrite existing data.** It is strongly recommended to drop and recreate the target database before restoring, or use the `--clean` flag.

### Restoring via Docker

To restore a backup into a running `db` container:

```bash
# 1. First, locate your backup file in the ./backups directory
BACKUP_FILE="./backups/backup_20231027_153000.dump"

# 2. Run pg_restore using a temporary container
docker run --rm \
  --network withus_default \
  -v $(pwd)/backups:/backups \
  postgres:15-alpine \
  pg_restore -d "postgresql://withus:withus_password@db:5432/withus_db" \
  --clean --if-exists --no-owner --no-privileges \
  /backups/backup_20231027_153000.dump
```

*Flags used:*
- `--clean --if-exists`: Drops database objects before recreating them.
- `--no-owner --no-privileges`: Skips restoring ownership and permissions, ensuring the data is owned by the user connecting to the DB.

---

## Production Recommendations

1. **Automated Scheduling**: In production, configure a standard host cron job (e.g., in `/etc/crontab`) to run the Docker backup command daily.
2. **Off-site Storage**: The current script retains backups locally on the filesystem. Consider adding a secondary cron job to sync the `./backups` directory to an S3 bucket (using `aws-cli` or `rclone`) to protect against catastrophic host failure.
3. **Validation**: Test the restore process periodically in a staging environment.
