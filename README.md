# WITHUS

Secure Delegation & Approval Platform.

## Overview
WITHUS allows organizations to delegate secure access (passwords, PATs, and sessions) to developers without ever revealing the underlying credentials. It leverages a browser extension to inject credentials directly into login forms, governed by temporary, revocable sessions.

## Architecture
- **Web App:** Next.js (Frontend UI)
- **API:** NestJS (Backend Server)
- **Database:** PostgreSQL (via Prisma)
- **Extension:** Chrome/Edge browser extension (esbuild)

## Features
- **Zero-Knowledge Delegation:** Passwords are encrypted with AES-256-GCM.
- **Temporary Sessions:** Time-bound access grants.
- **Browser Extension:** Native autofill injection blocking default password managers.
- **Audit Logs:** Full traceability.

## Production Status
This repository is configured for production. See `DEPLOYMENT.md` for deployment instructions.
