# WITHUS — Secure Delegation & Credential Management Platform

> **Enterprise-grade credential management, ephemeral delegated access, and automated OTP forwarding with Zero Raw Exposure.**

WITHUS (formerly SDAP — Secure Delegation & Approval Platform) is a full-stack, enterprise-grade credential management, access delegation, and governance platform. Engineered as a high-performance monorepo utilizing **NestJS 11**, **Next.js 16 (App Router & Turbopack)**, **PostgreSQL (Neon Serverless)**, **Prisma ORM**, **Redis 7**, and a dedicated **Chrome Manifest V3 Extension**, WITHUS enables organizations, founders, and security teams to grant time-bounded, capability-restricted, and strictly audited access to third-party web portals (such as GitHub, Vercel, GoDaddy, Shopify, Stripe, Razorpay, MCA, GST, Udyam, LinkedIn, and Google Workspace) **without ever disclosing raw master passwords or sharing two-factor authentication (2FA/OTP) verification codes over insecure channels**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Zero Raw Exposure & Extension Autofill](#zero-raw-exposure--extension-autofill)
  - [Multi-Tenant Vault & Secret Hierarchy](#multi-tenant-vault--secret-hierarchy)
  - [Ephemeral Delegated Access & Dual-Control Approvals](#ephemeral-delegated-access--dual-control-approvals)
  - [Automated Headless Gmail OTP Forwarding](#automated-headless-gmail-otp-forwarding)
  - [Capability Enforcement & Dashboard UI Shielding](#capability-enforcement--dashboard-ui-shielding)
  - [Programmatic Secret API & Webhooks](#programmatic-secret-api--webhooks)
  - [Enterprise Billing & HDFC SmartGateway](#enterprise-billing--hdfc-smartgateway)
  - [Platform Governance, Super Admin & Audit Trails](#platform-governance-super-admin--audit-trails)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Core Engineering Decisions](#core-engineering-decisions)
- [Delegated Access & Lifecycle Workflow](#delegated-access--lifecycle-workflow)
- [Supported Platforms Catalog](#supported-platforms-catalog)
- [Project Structure](#project-structure)
- [Prerequisites & Installation](#prerequisites--installation)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Running Automated Tests](#running-automated-tests)
- [Docker Setup](#docker-setup)
- [Production Build & Deployment](#production-build--deployment)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)
- [Author & License](#author--license)

---

## Overview

In modern engineering and business operations, granting team members or contractors access to third-party dashboards introduces critical operational and security risks:

1. **Credential Sprawl & Leakage:** Sharing passwords via Slack, WhatsApp, or standard password managers permanently puts raw credentials in the hands of individuals who eventually leave the company.
2. **2FA / OTP Interruption:** When third-party portals enforce multi-factor authentication, founders or system administrators are continually interrupted to relay one-time verification codes.
3. **Over-Privileged Access:** Traditional shared logins grant team members unfettered access to sensitive billing receipts, customer databases, API keys, or team permission settings.
4. **Relocation & Extraction Attacks:** Untrusted browser content scripts or malicious extensions can read input values, copy credentials from the DOM, or capture credentials using eye-toggle password reveal controls.
5. **Lack of Ephemerality:** Shared passwords lack automated expiration, making offboarding tedious, error-prone, and reliant on manual password rotation across dozens of websites.

**WITHUS resolves these vulnerabilities through a multi-tier, zero-exposure access delegation framework:**

- **Zero Raw Exposure:** Plaintext credentials never appear in DOM attributes or accessible extension variables. Inputs are injected using prototype-level value setters, protected against password reveal toggles, masked with `-webkit-text-security: disc`, and wiped from memory in milliseconds.
- **Two-Tier Envelope Encryption (AES-256-GCM):** Secrets are encrypted using ephemeral Data Encryption Keys (DEKs), wrapped under a 256-bit Master Encryption Key (MEK) with contextual Additional Authenticated Data (AAD) bound to the organization and secret hierarchy.
- **Automated OTP Streaming:** Dedicated OAuth integration with Google Workspace reads incoming 2FA verification emails in real time, extracts provider-specific security tokens via regex patterns, and forwards them directly to active delegated sessions.
- **Capability Enforcer:** Dynamic CSS rules and DOM guards injected into third-party dashboards prevent delegated operators from navigating to billing, team member management, or account deletion screens.

---

## Key Features

### Zero Raw Exposure & Extension Autofill
- **Prototype Setter Injection:** Bypasses framework synthetic event traps (React, Vue, Angular) by dispatching native DOM `input` and `change` events directly on `HTMLInputElement.prototype`.
- **Password Reveal Interception:** Overrides site eye-toggle icons, keyboard inspect shortcuts, and CSS pseudo-elements (`::-ms-reveal`). Active `MutationObserver` instances instantly flip any attempted `type="text"` tamper back to `type="password"`.
- **Visual Shielding:** Enforces `-webkit-text-security: disc !important; user-select: none !important;` to block screenshot tools and shoulder surfing.
- **Memory Purging:** In-flight plaintext credentials exist in extension memory only for the duration of the autofill operation (under 50 milliseconds) and are zeroed immediately after submission.
- **Shadow DOM Traversal:** Recursively penetrates open Shadow DOM roots (e.g., Shopify web components) to find dynamically nested username and password fields.

### Multi-Tenant Vault & Secret Hierarchy
- **Organization-Scoped Boundaries:** Secrets are partitioned into logical, isolated vaults with strict role-based access control (`OWNER`, `ADMIN`, `MEMBER`).
- **Platform Association:** Vaults can be linked directly to catalog platforms (e.g., `GITHUB`, `VERCEL`, `STRIPE`) or configured as generic vaults for arbitrary credentials.
- **Secret Versioning:** Every credential update creates a new immutable `SecretVersion` record with fresh cryptographic IVs and authentication tags, preserving audit history while keeping previous revisions encrypted.
- **Granular Secret Types:** Supports `PASSWORD`, `API_KEY`, `TOKEN`, `SSH_KEY`, `CERTIFICATE`, `OAUTH`, `COOKIE`, `TEXT`, and `JSON`.

### Ephemeral Delegated Access & Dual-Control Approvals
- **Time-Bounded Sessions:** Delegated access is issued with an explicit Time-To-Live (TTL). When the session window lapses, session tokens expire automatically across the platform.
- **Dual-Control Approval Pipeline:** Members submit access requests with business justification; owners or admins review, approve, or reject them with mandatory audit logging.
- **Cross-Organization Delegation:** Sessions can be safely delegated to external contractors (grantees outside the grantor's organization), accessible via `/sessions/incoming`.
- **Instant Revocation & Offboarding:** Platform administrators can terminate active sessions immediately or offboard members in a single click, invalidating tokens across both the backend and extension.

### Automated Headless Gmail OTP Forwarding
- **Server-Side Mailbox Listener:** Connects via Google OAuth 2.0 to scan incoming authentication emails without exposing the owner's mailbox to team members.
- **Heuristic Pattern Matching:** Pre-compiled regex extractors (`otp-patterns.ts`) recognize verification codes from Stripe, Razorpay, GitHub, GoDaddy, Shopify, LinkedIn, Vercel, and Google.
- **Safe Extraction Window:** Enforces a timestamp boundary (`receivedAfter >= loginStartTime`) to prevent stale or historic OTP codes from being fetched.
- **Automated Fill:** Extracted OTPs are transmitted over encrypted TLS channels directly to the extension service worker and autofilled into the 2FA prompt.

### Capability Enforcement & Dashboard UI Shielding
- **Client-Side Element Redaction:** Injects hardened, high-priority CSS rules into host web pages to hide sensitive UI elements:
  - Financial dashboards, billing tabs, and invoice download buttons.
  - Team management, invite links, and permission selectors.
  - Secret keys, API tokens, and credential export options.
- **DOM Tamper Trapping:** Prevents operators from using browser DevTools to remove hiding styles or inspect underlying form values.

### Programmatic Secret API & Webhooks
- **Machine-to-Machine Secret Access:** Scoped programmatic access via `ApiKeyGuard` (`wk_live_...` prefix) for automated CI/CD deployment pipelines.
- **Audited Reveals:** Programmatic secret access requires a mandatory `reason` parameter and generates an immutable audit event.
- **Outgoing Webhooks:** Organizations can subscribe to lifecycle webhooks (`secret.created`, `secret.revealed`, `session.created`, `session.revoked`) with HMAC signatures.

### Enterprise Billing & HDFC SmartGateway
- **HDFC SmartGateway (Juspay) Integration:** Cryptographically verified HMAC-SHA256 webhooks, server-side return URL handling, and automated mandate registration.
- **Flexible Subscription Tiers:**
  - **Free Tier (₹0):** Up to 2 team members, 2 platform integrations, 15-day platform change cooldown.
  - **Pro Tier (₹499/month | ₹4,990/year):** Up to 5 team members, all 11 supported platforms, extra seats at ₹50/user/month (₹500/year).
  - **Business Tier (₹999/month | ₹9,990/year):** Up to 15 team members, all 11 supported platforms, capability-level UI element masking, extra seats at ₹50/user/month.
- **Automated Schedulers:**
  - `BillingRenewalScheduler`: Automated daily renewal sweep for recurring mandates.
  - `BillingReconciliationScheduler`: Automated reconciliation job comparing internal payment states with HDFC SmartGateway APIs to resolve dropped checkout sessions.

### Platform Governance, Super Admin & Audit Trails
- **Tamper-Evident Audit Logging:** Captures actor ID, IP address, user agent, target entity, action type (`LOGIN`, `SECRET_REVEAL`, `SESSION_LAUNCH`, `SESSION_REVOKE`), and execution timestamps.
- **Real-Time Presence Tracking:** Service-worker-backed 30-second heartbeat mapping which team members are currently operating inside delegated third-party portals.
- **Platform-Level Super Admin Panel:** Platform overview metrics, organization governance, system analytics, and system audit log exports.

---

## Tech Stack

| Layer | Technologies & Frameworks | Description |
| :--- | :--- | :--- |
| **Monorepo Engine** | Turborepo, npm Workspaces | Build orchestration, incremental caching, shared type systems |
| **Backend API** | NestJS 11, Express 5, Node.js 20+ | Enterprise modular backend, DI container, controller-service pattern |
| **Database & ORM** | PostgreSQL 15 (Neon Serverless), Prisma ORM | Relational persistence, automated migrations, type-safe queries |
| **Cache & Throttling** | Redis 7 (ioredis), `rate-limit-redis` | Distributed token bucket rate-limiting, session presence caching |
| **Security & Crypto** | AES-256-GCM, Argon2id, RS256 JWT, Node `crypto` | Two-tier envelope encryption, AAD context binding, asymmetric tokens |
| **Frontend Web App** | Next.js 16 (App Router), React 19, Turbopack | Server components, standalone output, responsive dashboard |
| **Styling & Icons** | Tailwind CSS v3.4, Lucide React, Lenis | Modern glassmorphic theme, smooth inertial scrolling |
| **State & Data Fetching** | TanStack React Query v5, Axios | Optimistic mutations, background revalidation, automated token retry |
| **Browser Extension** | Chrome Manifest V3, TypeScript, esbuild | Declarative content scripts, background service worker, alarms API |
| **Payment Gateway** | HDFC SmartGateway (Juspay API) | Mandate management, recurring subscriptions, HMAC-SHA256 webhooks |
| **Email & OTP** | Google Workspace APIs, Nodemailer, Resend | OAuth 2.0 Gmail token polling, regex OTP extraction, transactional mail |
| **Testing & Quality** | Jest 30, ts-jest, Supertest, ESLint, Prettier | Unit tests, security regression suites, automated linting |

---

## System Architecture

```
                                  +---------------------------------------+
                                  |         Google Chrome Browser         |
                                  |                                       |
                                  |  +---------------------------------+  |
                                  |  |   WITHUS Extension (MV3)        |  |
                                  |  |   - Service Worker (Token/Auth) |  |
                                  |  |   - Content Script (Autofill)   |  |
                                  |  |   - Capability Enforcer (CSS)   |  |
                                  |  +-----------------+---------------+  |
                                  +--------------------|------------------+
                                                       |
                                         HTTPS / JSON  |  Bearer Access Token
                                                       v
+-----------------------------+          +--------------------------------+
|    Next.js 16 Web Portal    |          |     NestJS 11 Core API Engine  |
|    - Dashboard UI           |          |     - Auth & Refresh Service   |
|    - Vault & Secret UI      | -------->|     - Envelope Encryption      |
|    - Session Approvals      |          |     - Delegated Sessions       |
|    - Billing & Invoices     |          |     - Gmail OTP Extractor      |
+-----------------------------+          |     - HDFC SmartGateway API    |
                                         +----------------+---------------+
                                                          |
                      +-----------------------------------+-----------------------------------+
                      |                                   |                                   |
                      v                                   v                                   v
        +---------------------------+       +---------------------------+       +---------------------------+
        |   PostgreSQL Database     |       |       Redis Server        |       |   External Integrations   |
        |   - Users & Organizations |       |   - Throttling Counters   |       |   - HDFC SmartGateway     |
        |   - Ciphertexts & IVs     |       |   - Presence Heartbeats   |       |   - Google OAuth / Gmail  |
        |   - Delegated Sessions    |       |   - Ephemeral Key Caching |       |   - Third-Party Portals   |
        |   - Audit Trails          |       +---------------------------+       +---------------------------+
        +---------------------------+
```

---

## Core Engineering Decisions

### 1. Two-Tier Envelope Encryption with Contextual AAD (ADR-007)
* **Problem:** Storing raw secrets or encrypting all database rows with a single shared symmetric key means that a single database dump or memory leak exposes all secrets across all tenants.
* **Decision:** We implemented a two-tier key hierarchy using **AES-256-GCM**:
  - **Data Encryption Key (DEK):** A unique, cryptographically random 256-bit key (`crypto.randomBytes(32)`) generated per secret version.
  - **Master Encryption Key (MEK):** A 256-bit root key stored strictly in system environment variables (`VAULT_ENCRYPTION_KEY`), never persisted in the database.
  - **Additional Authenticated Data (AAD):** During encryption, context metadata is serialized as `${orgId}:${vaultId}:${secretId}:${version}` and supplied as AAD. If an attacker tampers with database IDs to relocate ciphertext from one organization to another, GCM authentication tag verification fails immediately.
  - **Zero Fingerprint Exposure (Remediation F-002):** Unsalted plaintext SHA-256 hashes are strictly prohibited to prevent rainbow table or offline dictionary attacks from database dumps.

### 2. Zero Raw Exposure DOM Shielding
* **Problem:** Standard browser autofill fills form elements directly, allowing users to inspect input values via Chrome DevTools, click "Show Password" eye icons, or execute DOM script extraction.
* **Decision:** The content script implements an anti-inspection sandbox:
  - **Prototype-Level Setter:** Directly invokes `HTMLInputElement.prototype` value descriptors to avoid exposing credential parameters in global window objects.
  - **Input Type Locking:** A continuous `MutationObserver` monitors password elements. If any script or user attempts to modify `type="password"` to `type="text"`, it is instantly reverted.
  - **Visual Shielding:** Injects high-specificity CSS (`-webkit-text-security: disc !important; user-select: none !important;`) and permanently hides native and custom eye-toggle buttons.
  - **Immediate Memory Purge:** Plaintext variables in the content script and service worker are explicitly reassigned and garbage-collected within milliseconds of form injection.

### 3. Ephemeral MV3 Service Worker Presence Heartbeats
* **Problem:** Chrome Manifest V3 service workers terminate automatically after 30 seconds of inactivity, which breaks long-polling connections and traditional WebSocket heartbeats.
* **Decision:** We use `chrome.alarms` to drive presence reporting:
  - An alarm fires every 30 seconds (`presence-heartbeat`).
  - Active platform tabs are indexed in `chrome.storage.local`.
  - Heartbeat requests are deduplicated by `orgId::platform`, ensuring network calls remain minimal and survive background worker restarts.

### 4. Authoritative Server-Side Pricing & Billing Validation
* **Problem:** Clients could manipulate checkout amounts, platform limits, or extra user seat calculations in client-side code.
* **Decision:** All plan pricing (Free ₹0, Pro ₹499/mo, Business ₹999/mo) and seat rates (₹50/user/mo) are computed authoritatively on the backend (`billing.service.ts`). Webhook payloads from HDFC SmartGateway are verified using HMAC-SHA256 signatures before provisioning resources.

### 5. Strict Cross-Tenant Boundary Enforcement
* **Problem:** In multi-tenant systems, broken object-level authorization (BOLA) can allow members of Organization A to access secrets belonging to Organization B if they guess UUIDs.
* **Decision:** Every database query in `secrets.controller.ts` and `sessions.service.ts` joins through `OrganizationMember`, verifying that the requesting user's membership is active and matches the targeted tenant.

---

## Delegated Access & Lifecycle Workflow

```
[ Team Member ]              [ Admin / Owner ]               [ WITHUS API ]             [ Chrome Extension ]         [ Third-Party Site ]
      |                             |                             |                             |                             |
      |-- 1. Request Access ------->|                             |                             |                             |
      |                              |-- 2. Approve Request ----->|                             |                             |
      |                             |                             |-- 3. Create Session Token ->|                             |
      |                             |                             |      (Time-limited TTL)     |                             |
      |                                                           |                             |-- 4. Navigate to Login ---->|
      |                                                           |                             |      (e.g., github.com)     |
      |                                                           |<-- 5. Query Active Session -|                             |
      |                                                           |-- 6. Return Payload ------->|                             |
      |                                                           |      (Encrypted DEK)        |-- 7. Shield DOM Input ----->|
      |                                                           |                             |      (Type-locked & Masked) |
      |                                                           |                             |-- 8. Autofill & Submit ---->|
      |                                                           |<-- 9. Poll Gmail for OTP ---|                             |
      |                                                           |-- 10. Forward Extracted OTP>|-- 11. Autofill OTP -------->|
      |                                                           |                             |                             |
      |                             |-- 12. Revoke / Expire ----->|-- 13. Invalidate Session -->|-- 14. Purge Local Storage   |
```

1. **Access Request:** The team member selects a platform credential from the dashboard and submits an access request specifying reason and duration.
2. **Dual-Control Approval:** The vault owner receives the request and authorizes it. An ephemeral `DelegatedSession` record is minted with an active TTL.
3. **Session Discovery:** When the operator navigates to the third-party login portal, the extension content script identifies the host domain and queries the background service worker.
4. **Credential Retrieval & Zero-Exposure Fill:** The service worker validates the user's JWT and requests a one-time launch token from `/sessions/:id/launch`. The content script locks the input field type, injects the credentials, and triggers the login form submission.
5. **Headless OTP Handling:** If the platform prompts for a one-time passcode, the backend's Gmail OTP listener detects the incoming verification email, extracts the numerical code, and delivers it to the extension to complete login.
6. **Presence & Revocation:** The extension transmits periodic presence heartbeats. Once work is complete, or if the administrator clicks "Revoke Session", access tokens are invalidated and local caches are wiped.

---

## Supported Platforms Catalog

WITHUS provides native autofill selectors, submission adapters, and UI redaction rules for 11 core platforms out of the box:

| Platform ID | Platform Name | Supported Domains | OTP Extraction | Capability Redaction Support |
| :--- | :--- | :--- | :---: | :---: |
| `GITHUB` | GitHub | `github.com` | Email OTP | Repository Settings, Security, Actions, Billing |
| `VERCEL` | Vercel | `vercel.com` | Email OTP | Team Settings, Billing, Environment Variables |
| `GODADDY` | GoDaddy | `godaddy.com`, `sso.godaddy.com` | Email OTP | Account Settings, Payment Methods, Renewals |
| `LINKEDIN` | LinkedIn | `linkedin.com` | Email OTP | Settings & Privacy, Billing, Company Admin |
| `SHOPIFY` | Shopify | `shopify.com`, `admin.shopify.com` | Email OTP | Store Settings, Payments, User Permissions |
| `STRIPE` | Stripe | `stripe.com`, `dashboard.stripe.com` | Email OTP | Developers Tab, API Keys, Bank Account Settings |
| `RAZORPAY` | Razorpay | `razorpay.com`, `dashboard.razorpay.com` | Email OTP | API Keys, Webhooks, Settlements, Banking |
| `MCA` | MCA Portal | `mca.gov.in` | Portal OTP | Ministry of Corporate Affairs Filings & Submissions |
| `GST` | GST Portal | `gst.gov.in`, `services.gst.gov.in` | Portal OTP | Returns Filing, Tax Payments, Registration |
| `UDYAM` | Udyam Portal | `udyamregistration.gov.in` | Portal OTP | MSME Registration & Certificate Management |
| `GMAIL` | Google / Gmail | `accounts.google.com`, `mail.google.com`| OAuth / Email | Account Security, 2-Step Verification, Subscriptions |

---

## Project Structure

```text
SDAP/
├── apps/
│   ├── api/                           # NestJS 11 Core Backend API
│   │   ├── src/
│   │   │   ├── api-keys/              # Programmatic API Key Management
│   │   │   ├── approvals/             # Dual-Control Access Approval Engine
│   │   │   ├── audit/                 # Tamper-Evident Audit Logging
│   │   │   ├── auth/                  # Authentication, JWT, Argon2id, Google OAuth
│   │   │   ├── authorization/         # RBAC Guards & Permissions
│   │   │   ├── billing/               # HDFC SmartGateway, Juspay Webhooks, Schedulers
│   │   │   ├── common/                # Filters, Interceptors, Pipes, Guards
│   │   │   ├── config/                # Zod Environment Validation
│   │   │   ├── health/                # Terminus Health Checks
│   │   │   ├── integrations/          # OAuth Connectors & Gmail OTP Service
│   │   │   ├── organizations/         # Multi-Tenant Organizations & Invitations
│   │   │   ├── programmatic/          # CI/CD Machine-to-Machine Endpoints
│   │   │   ├── sessions/              # Delegated Sessions, Heartbeats & Presence
│   │   │   ├── super-admin/           # Platform-Level Governance Controller
│   │   │   ├── users/                 # User Profile & Presence Management
│   │   │   └── vaults/                # Envelope Encryption, Secrets & Versioning
│   │   ├── test/                      # End-to-End Jest Test Suites
│   │   └── Dockerfile                 # Production Multi-Stage Container Definition
│   │
│   ├── web/                           # Next.js 16 SaaS Dashboard Web Application
│   │   ├── app/                       # App Router Pages, Layouts, Server Actions
│   │   ├── components/                # UI Components, Modals, Vault Forms, Tables
│   │   ├── hooks/                     # Custom React Query & Authentication Hooks
│   │   ├── lib/                       # API Clients, Subscription Configs, Utilities
│   │   └── Dockerfile                 # Standalone Production Web Container
│   │
│   ├── extension/                     # Chrome Manifest V3 Browser Extension
│   │   ├── src/
│   │   │   ├── background/            # Service Worker (Auth, Alarms, Heartbeats)
│   │   │   ├── content/               # Autofill Script & Capability Enforcer
│   │   │   ├── lib/                   # Extension Storage, API Client, Types
│   │   │   ├── popup/                 # Interactive Extension UI Popup
│   │   │   └── providers/             # Declarative Platform Selectors (11+ Portals)
│   │   ├── build.mjs                  # esbuild Bundler Script
│   │   └── manifest.json              # Chrome Manifest V3 Configuration
│   │
│   ├── marketing/                     # Next.js 16 Landing Page & Pricing Matrix
│   └── docs/                          # Next.js 16 Documentation Portal
│
├── packages/
│   ├── config/                        # Shared Configuration Constants
│   ├── db/                            # Prisma Schema, Migrations & Database Client
│   ├── eslint-config/                 # Shared ESLint Rules
│   ├── security/                      # Cryptographic Routines & Password Hashing
│   ├── types/                         # Shared TypeScript Interfaces, Enums & DTOs
│   ├── typescript-config/             # Shared tsconfig Presets
│   └── ui/                            # Shared React Component Primitives
│
├── docker/                            # Docker Compose Environments (Dev / Prod)
├── docker-compose.yml                 # Local Development Compose File
├── turbo.json                         # Turborepo Pipeline Caching Rules
└── package.json                       # Monorepo Workspace Configuration
```

---

## Prerequisites & Installation

### Prerequisites
- **Node.js:** `v20.x` or higher (LTS recommended; engines define `>=18`)
- **Package Manager:** `npm` version `10.8.2` or higher
- **Database:** PostgreSQL 15+ (Local instance or Neon Serverless PostgreSQL)
- **Cache:** Redis 7+ (Local or managed Redis instance)
- **Browser:** Google Chrome (for unpacking and running the MV3 extension)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/withus.git
cd withus
```

### 2. Install Dependencies
Install all packages across the entire monorepo using npm workspaces:
```bash
npm install
```

### 3. Generate Prisma Database Client
Generate the type-safe Prisma client from `packages/db/prisma/schema.prisma`:
```bash
npx prisma generate --schema=packages/db/prisma/schema.prisma
```

### 4. Run Database Migrations
Apply all schema migrations to your PostgreSQL database:
```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

---

## Environment Variables

Copy the `.env.example` templates in each app before starting the system.

### Backend API (`apps/api/.env`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (PgBouncer pooled) | **Yes** | `postgresql://user:pass@localhost:5432/sdap_db` |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) | Optional | `postgresql://user:pass@localhost:5432/sdap_db` |
| `VAULT_ENCRYPTION_KEY` | 32-byte Base64 encoded Master Encryption Key (MEK) | **Yes** | `node -e "console.log(crypto.randomBytes(32).toString('base64'))"` |
| `JWT_PRIVATE_KEY` | RSA Private Key for RS256 token signing (PEM format) | **Yes** | `-----BEGIN RSA PRIVATE KEY-----...` |
| `JWT_PUBLIC_KEY` | RSA Public Key for RS256 token verification (PEM format) | **Yes** | `-----BEGIN PUBLIC KEY-----...` |
| `PORT` | HTTP Port for the NestJS API | Optional | `4000` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | Optional | `development` |
| `CORS_ORIGIN` | Exact frontend URL permitted for CORS | **Yes** | `http://localhost:3000` |
| `REDIS_URL` | Redis connection URL for distributed throttling | Optional | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Gmail OTP integration | Optional | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret for Gmail OTP integration | Optional | `GOCSPX-xxx` |
| `HDFC_BASE_URL` | HDFC SmartGateway / Juspay API Base URL | Prod | `https://smartgateway.hdfcbank.com` |
| `HDFC_MERCHANT_ID` | HDFC SmartGateway Merchant Identifier | Prod | `WITHUS_PROD_MERCHANT` |
| `HDFC_API_KEY` | HDFC Gateway API Secret Key | Prod | `sec_key_xxx` |
| `HDFC_RESPONSE_KEY` | HMAC-SHA256 Key for validating webhook callbacks | Prod | `res_key_xxx` |
| `HDFC_WEBHOOK_USERNAME` | Basic Auth username for receiving Juspay webhooks | Prod | `withus_wh_user` |
| `HDFC_WEBHOOK_PASSWORD` | Basic Auth password for receiving Juspay webhooks | Prod | `withus_wh_secure_password` |

### Web Portal (`apps/web/.env.local`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Target URL pointing to the NestJS API | **Yes** | `http://localhost:4000/api/v1` |
| `PORT` | Port for the Next.js frontend | Optional | `3000` |
| `LANDING_URL` | URL of the separately deployed marketing site | Optional | `http://localhost:3002` |

### Chrome Extension (`apps/extension/.env`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `WITHUS_API_URL` | Target API URL reachable by client browsers | **Yes** | `http://localhost:4000/api/v1` |

---

## Local Development

### Running the Entire Monorepo
Start all applications concurrently using Turborepo:
```bash
npm run dev
```

### Running Targeted Applications
To run individual applications without loading the full suite:

- **Run Backend API only:**
  ```bash
  npm run dev -w api
  ```
- **Run Web Portal only:**
  ```bash
  npm run dev -w web
  ```
- **Build Extension in watch mode:**
  ```bash
  npm run dev -w withus-extension
  ```

### Loading the Extension into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `apps/extension/dist` folder generated by the build script.

---

## Running Automated Tests

The testing suite contains unit tests, integration specs, and security regression suites covering encryption safety, tenant isolation, and billing logic.

### Execute All Tests
```bash
npm test
```

### Run API Unit & Security Tests
```bash
npm test -w api
```

### Run Dedicated Security Regression Suites
```bash
# Verify envelope encryption and AAD context binding
npx jest apps/api/src/vaults/encryption.service.spec.ts

# Verify CORS exact allowlist & CSRF protection
npx jest apps/api/src/common/middleware/csrf-cors.security.spec.ts

# Verify cross-tenant isolation and active membership guards
npx jest apps/api/src/sessions/sessions.service.membership.spec.ts

# Verify HDFC SmartGateway billing security and signature validation
npx jest apps/api/src/billing/billing.security.spec.ts
```

---

## Docker Setup

### Local Infrastructure (PostgreSQL + Redis + pgAdmin)
A development compose file is provided in the repository root to start backend infrastructure:

```bash
docker compose up -d
```

This spins up:
- **PostgreSQL 15:** Port `5432` (User: `postgres`, Password: `password`, DB: `sdap`)
- **Redis 7:** Port `6379`
- **pgAdmin 4 (optional profile):** Port `5050`

### Full Production Stack Deployment
To run containerized production builds of the API and Web applications:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Production Build & Deployment

### Monorepo Build Execution
Compile all TypeScript packages, bundle Next.js standalone outputs, and package the Chrome extension:
```bash
npm run build
```

### Build Artifacts
- **Backend API:** Compiled into `apps/api/dist/src/main.js`.
- **Web App:** Next.js standalone output in `apps/web/.next/standalone`.
- **Extension:** Packaged zip bundle created at `apps/extension/withus-extension.zip` ready for Chrome Web Store distribution.

---

## API Reference

All backend routes are prefixed with `/api/v1`.

### 1. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register user account and create primary organization |
| `POST` | `/auth/login` | Public | Authenticate user; returns RS256 access and refresh tokens |
| `POST` | `/auth/refresh` | Public | Rotate refresh token and issue fresh access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token family and clear session cookies |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile and memberships |
| `GET` | `/auth/google` | Public | Initiate Google OAuth 2.0 redirection |
| `GET` | `/auth/google/callback` | Public | Google OAuth 2.0 authentication callback |

### 2. Vaults & Secrets (`/organizations/:orgId`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/vaults` | Admin / Owner | Create an isolated credential vault |
| `GET` | `/organizations/:orgId/vaults` | Member | List vaults accessible to the user |
| `POST` | `/organizations/:orgId/vaults/:vaultId/secrets` | Admin / Owner | Store and encrypt a new secret payload |
| `GET` | `/organizations/:orgId/vaults/:vaultId/secrets` | Member | List secret metadata in a vault |
| `POST` | `/organizations/:orgId/vaults/:vaultId/secrets/:id/reveal` | Admin / Owner | Decrypt and reveal secret payload (audited) |
| `DELETE`| `/organizations/:orgId/vaults/:vaultId/secrets/:id` | Admin / Owner | Soft-delete a secret record |

### 3. Delegated Sessions (`/organizations/:orgId/sessions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/sessions` | Admin / Owner | Create an ephemeral delegated session |
| `GET` | `/organizations/:orgId/sessions/incoming` | Grantee | List active sessions delegated to the caller |
| `GET` | `/organizations/:orgId/sessions/outgoing` | Grantor | List active sessions granted by the caller |
| `POST` | `/organizations/:orgId/sessions/:id/launch` | Grantee | Issue single-use autofill token for extension fill |
| `POST` | `/organizations/:orgId/sessions/:id/otp` | Grantee | Request latest automated OTP for active session |
| `POST` | `/organizations/:orgId/sessions/:id/revoke` | Admin / Owner | Instantly invalidate and terminate a delegated session |

### 4. Billing & Subscriptions (`/organizations/:orgId/billing`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/billing/initiate` | Owner | Create HDFC SmartGateway order for plan upgrade |
| `GET` | `/organizations/:orgId/billing/status` | Member | Check active subscription tier, seats, and entitlements |
| `POST` | `/organizations/:orgId/billing/cancel` | Owner | Cancel auto-renewal for current subscription |
| `POST` | `/billing/webhook` | HDFC Webhook | Ingest and verify signed Juspay payment events |
| `POST` | `/billing/return` | HDFC Gateway | Process client redirect upon payment completion |

### 5. Super Admin Governance (`/super-admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/super-admin/overview` | Super Admin | System health, tenant count, active sessions, MRR |
| `GET` | `/super-admin/organizations` | Super Admin | Paginated tenant organization registry |
| `GET` | `/super-admin/audit` | Super Admin | System-wide immutable security audit stream |

---

## Security Considerations

### Cryptographic Rigor
- **Symmetric Cipher:** `aes-256-gcm` using 96-bit (12-byte) initialization vectors generated per encryption operation via `crypto.randomBytes(12)`.
- **Authentication Tags:** 128-bit (16-byte) GCM tags verified before returning decrypted plaintext.
- **Master Key Segregation:** Root encryption keys are injected strictly via environment variables (`VAULT_ENCRYPTION_KEY`) and are never written to disk, database, or logs.
- **Zero Plaintext Hash Storage:** SHA-256 credential hashing in `SecretVersion` was eliminated (F-002 remediation) to ensure that a database leak cannot be used for offline brute-force attacks.

### Transport & Network Defenses
- **Exact-Match CORS Allowlist:** Wildcard origins (`*`) are prohibited. Preflight requests validate exact origin matching against configured production domains.
- **Double-Submit CSRF Protection:** State-changing requests must present matching cryptographic tokens in both request headers and HTTP-only cookies.
- **Secure Token Attributes:** Authentication cookies enforce `SameSite=None` (production) / `Lax` (development), `Secure=true`, and `HttpOnly=true`.

### Client-Side Isolation
- **Input Masking:** Password fields are secured using `-webkit-text-security: disc !important` to ensure credentials remain invisible to over-the-shoulder observation and screenshot utilities.
- **Type-Locking Watchers:** DOM mutation observers continuously detect and revert attempts by malicious scripts or browser inspectors to change password field types.
- **Short-Lived Memory Footprint:** Secret buffers in the Chrome extension are zeroed out immediately following DOM input submission.

---

## Current Limitations

1. **Desktop Browser Scope:** The current browser extension is built for Chromium-based desktop browsers (Google Chrome, Brave, Microsoft Edge). Support for Safari Web Extensions and Android/iOS mobile autofill requires separate native adapters.
2. **Third-Party DOM Volatility:** Platform autofill relies on DOM element selectors. If upstream services (e.g., GitHub or Shopify) overhaul their login page markup, selector mappings in `platform-registry.ts` may require periodic updates.
3. **Single-Node Schedulers:** Billing renewal and reconciliation cron jobs run on NestJS instance timers. Clustered multi-instance deployments require Redis Redlock synchronization to prevent duplicate scheduler runs.

---

## Future Improvements

- [ ] **Native Mobile Autofill Integration:** Native Android (`AutofillService`) and iOS (`ASCredentialProviderViewController`) applications for mobile credential delegation.
- [ ] **Distributed Queue Architecture:** Migration of billing renewal sweeps and email listeners to BullMQ backed by Redis for horizontal scalability.
- [ ] **FIDO2 / WebAuthn Support:** Hardware security key authentication (YubiKey) for platform authorization and vault decryption.
- [ ] **Dynamic Platform Selector Updates:** Remote configuration endpoint allowing zero-downtime updates to platform CSS selectors without republishing the Chrome extension.

---

## Author & License

- **Platform Engineering Team:** WITHUS Core Development Team
- **License:** Proprietary — All Rights Reserved. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
