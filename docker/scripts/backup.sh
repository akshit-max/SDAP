#!/bin/sh
set -e

# WITHUS Database Backup Script
# Usage: ./backup.sh
# Can be run directly on the host or inside a Docker container.

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.dump"

echo "Starting database backup to $BACKUP_FILE..."

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Using DATABASE_URL for connection."
    pg_dump -Fc "$DATABASE_URL" -f "$BACKUP_FILE"
elif [ -n "$POSTGRES_DB" ] && [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_HOST" ]; then
    echo "Using discrete POSTGRES_* environment variables."
    export PGPASSWORD="$POSTGRES_PASSWORD"
    pg_dump -Fc -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$BACKUP_FILE"
    unset PGPASSWORD
else
    echo "Error: Connection details missing."
    echo "Please provide either DATABASE_URL OR (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST)."
    exit 1
fi

echo "Backup completed successfully: $BACKUP_FILE"

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.dump" -type f -mtime +"$RETENTION_DAYS" -exec rm -f {} \;
echo "Cleanup complete."
