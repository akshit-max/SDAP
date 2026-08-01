# Deployment Guide

This guide covers the deployment of the WITHUS platform.

## 1. Prerequisites
- A PostgreSQL Database (e.g., Neon, Supabase, RDS)
- Node.js 18+
- Vercel account (for frontend)
- Render/Railway/EC2 (for backend API)

## 2. Environment Variables
Copy the `.env.example` files to `.env` in both `apps/api` and `apps/web`.
**CRITICAL:** Ensure `VAULT_ENCRYPTION_KEY` is a securely generated 32-byte Base64 string. Never commit this key!

## 3. Database Migration
Run `npx prisma db push` (or `npx prisma migrate deploy` if using migrations) against your production database.

## 4. Backend Deployment (Render/Railway)
1. Set `NODE_ENV=production`.
2. Provide all environment variables from `apps/api/.env.example`.
3. Build command: `npm install && npm run build`
4. Start command: `npm run start:prod` (or equivalent for your platform).

## 5. Frontend Deployment (Vercel)
1. Connect your repository to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
3. Vercel will automatically detect Next.js and build it.

## 6. Extension Distribution
The extension is built automatically into `WITHUS-Extension.zip` using the `npm run release` script. It is served statically by the Next.js frontend and can be downloaded from the Dashboard.
