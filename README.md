# WITHUS — Secure Delegated Access Platform (SDAP)

WITHUS is a monorepo containing the Next.js web application and NestJS backend API.

## 🚀 Local Development Workflow (Cloud-Backed)

We have migrated away from Docker for day-to-day development. Our local environment connects directly to persistent cloud services (Neon PostgreSQL and Upstash Redis) to eliminate database resets and daemon bottlenecks.

**Note:** Docker is strictly reserved for production deployment and release validation.

### 1. Initial Setup

First, install dependencies:
```sh
npm install
```

Copy the environment template and fill in your cloud credentials:
```sh
cp .env.example .env
```
*(Ensure `.env` is never committed to Git).*

### 2. Database Migration

Push the Prisma schema to your Neon database. This step is only required once, or whenever the schema changes.
```sh
npm run db:push --workspace=@repo/db
```
*(Alternatively, use `npx prisma migrate dev` if you prefer tracking migration history locally).*

### 3. Start Development Server

Run the complete stack (Web + API) locally:
```sh
npm run dev
```

The applications will be available at:
- Web Application: http://localhost:3000
- API Backend: http://localhost:4000/api/docs (Swagger UI)

## 📦 Production & Deployment

While development happens locally against cloud databases, the application is packaged and deployed using Docker.

Do **NOT** use Docker for daily development unless testing a deployment.
```sh
docker compose -f docker/docker-compose.prod-test.yml up --build
```
