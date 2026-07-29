# SDAP Deployment Guide

This document outlines the steps to deploy the Secure Delegation & Approval Platform (SDAP) into a production environment using Docker Compose.

## Prerequisites
- Docker & Docker Compose
- PostgreSQL 15+ (if not using the bundled Compose DB)
- Node.js 18+ (for running migrations manually)

## Step 1: Environment Configuration

Create a `.env` file in the root directory. This MUST NOT be committed to version control.

```env
# Database
DATABASE_URL="postgresql://sdap_user:sdap_password@db:5432/sdap_db?schema=public"

# Security (MUST BE CHANGED)
JWT_SECRET="generate_a_secure_random_string"
VAULT_ENCRYPTION_KEY="32_byte_base64_encoded_string=="

# API & Web Config
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://app.yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

## Step 2: Running Migrations

Before the API can start, the database schema must be initialized.

```bash
# Start the database container
docker-compose -f docker-compose.prod.yml up -d db

# Wait for DB to be ready, then run Prisma DB push or migrate
npx prisma db push --schema=packages/db/prisma/schema.prisma

# (For robust production deployments, use `npx prisma migrate deploy`)
```

## Step 3: Start the Platform

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Verify the services are running:
```bash
docker-compose -f docker-compose.prod.yml ps
```

## Step 4: Health Check

Verify the API is healthy by visiting the health endpoint:
```bash
curl http://localhost:3000/health
```
Expected output:
```json
{
  "status": "ok",
  "info": { ... },
  "error": {},
  "details": { ... }
}
```

## Rollback Procedure
If a database migration causes issues, restore from your automated DB snapshots. The API containers are stateless and can be rolled back simply by pulling a previous Docker image tag.
