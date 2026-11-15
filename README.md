# WITHUS

**Enterprise-grade credential delegation, ephemeral session governance, and automated headless 2FA/OTP forwarding with Zero Raw Exposure.**

WITHUS is a secure credential management and delegated access platform designed for organizations, founders, and security teams. Built with **NestJS 11**, **Next.js 16 (App Router)**, **PostgreSQL (Neon Serverless)**, **Prisma ORM**, **Redis 7**, and a dedicated **Chrome Manifest V3 Extension**, the platform allows businesses to grant time-bounded, capability-restricted, and strictly audited access to third-party portals (such as GitHub, Vercel, GoDaddy, Shopify, Stripe, Razorpay, MCA, GST, Udyam, LinkedIn, and Google Workspace) **without ever disclosing raw master passwords or sharing two-factor authentication (2FA/OTP) verification codes over insecure channels**.

The primary engineering focus of this project is **Zero Raw Exposure** and **tamper-evident multi-tenant isolation**. This includes prototype-level DOM injection, continuous input type-locking via `MutationObserver`, two-tier envelope encryption (AES-256-GCM) with contextual Additional Authenticated Data (AAD), automated headless Gmail OTP extraction, dynamic dashboard capability masking, and cryptographically verified HDFC SmartGateway subscription billing.

---

## Table of Contents

- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Cryptographic Vault & Envelope Encryption Pipeline](#cryptographic-vault--envelope-encryption-pipeline)
- [Zero Raw Exposure DOM Shielding Engine](#zero-raw-exposure-dom-shielding-engine)
- [Automated Headless Gmail OTP Extraction Pipeline](#automated-headless-gmail-otp-extraction-pipeline)
- [Capability Enforcement & UI Shielding System](#capability-enforcement--ui-shielding-system)
- [Enterprise Billing & Reconciliation Engine](#enterprise-billing--reconciliation-engine)
- [Security & Data Integrity](#security--data-integrity)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Installation & Local Development](#installation--local-development)
- [Environment Variables](#environment-variables)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Engineering Decisions & Trade-offs](#engineering-decisions--trade-offs)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Key Features

### 1. Zero Raw Exposure Form Injection
- Evaluates target login forms using declarative platform selectors and injects credentials using prototype-level property descriptor setters (`HTMLInputElement.prototype`).
- Bypasses framework synthetic event traps (React, Vue, Angular) by dispatching native DOM `input` and `change` events directly.
- Plaintext credentials exist in extension memory only for the duration of the autofill operation (under 50 milliseconds) and are zeroed immediately after submission.
- Recursively penetrates open Shadow DOM roots (e.g., Shopify web components) to locate deeply nested input fields.

### 2. Password Reveal Interception & DOM Shielding
- Active `MutationObserver` instances continuously monitor password input fields. Any script or user action attempting to mutate `type="password"` to `type="text"` is instantly flipped back to `type="password"`.
- Bounding-box proximity scanning identifies and hides third-party eye-toggle reveal buttons (both SVG icons and custom interactive elements).
- Injects high-specificity CSS (`-webkit-text-security: disc !important; user-select: none !important;`) to neutralize screen-recording and shoulder-surfing risks.

### 3. Two-Tier Envelope Encryption (AES-256-GCM + Contextual AAD)
- Implements two-tier cryptographic key segregation: unique 256-bit symmetric Data Encryption Keys (DEKs) are generated per secret version via `crypto.randomBytes(32)` and wrapped under a 256-bit Master Encryption Key (MEK).
- Additional Authenticated Data (AAD) is cryptographically bound to ciphertext during encryption using the format `${orgId}:${vaultId}:${secretId}:${version}`. Any cross-tenant relocation attack immediately causes authentication tag verification to fail.
- Fully eliminates plaintext hash storage (`fingerprint: ''`), ensuring offline dictionary attacks cannot be mounted against database copies (Security Remediation F-002).

### 4. Ephemeral Delegated Access & Dual Approvals
- Grants time-limited, revocable session tokens (`DelegatedSession`) configured with explicit Time-To-Live (TTL) expiration timestamps.
- Dual-control approval workflow: team members request platform access with business justification, and vault owners/admins review, approve, or reject requests with mandatory audit logging.
- Cross-organization delegation support allows granting ephemeral sessions to external contractors without adding them to internal organization vaults (`/sessions/incoming`).
- Immediate administrative revocation invalidates session tokens across the backend and extension in real time.

### 5. Automated Headless Gmail OTP Extraction
- Connects securely via Google OAuth 2.0 to scan incoming authentication emails without exposing the owner's inbox to delegated users.
- An ordered regex pattern registry (`otp-patterns.ts`) extracts 4- to 10-digit 2FA codes for 11+ providers (Stripe, Razorpay, GitHub, GoDaddy, Shopify, LinkedIn, Vercel, Google).
- Enforces a strict timestamp boundary (`receivedAfter >= loginStartTime`) to prevent historical verification codes from being processed.
- Automatically streams extracted OTPs to the Chrome extension service worker to complete two-factor authentication prompts without manual human relay.

### 6. Capability Enforcement & Dashboard UI Shielding
- Injects hardened CSS rules into third-party dashboards to redact sensitive administrative pages based on session capability configurations.
- Hides billing tabs, invoice downloads, team member settings, API keys, and account deletion buttons on target platforms (GitHub, Vercel, Stripe, Razorpay, GoDaddy, Shopify).
- Employs DOM tamper traps to prevent delegated operators from removing redaction styles via browser DevTools.

### 7. Enterprise Billing & HDFC SmartGateway Integration
- Built on HDFC Bank SmartGateway (Juspay API) with cryptographically verified HMAC-SHA256 webhook signatures (`HDFC_RESPONSE_KEY`).
- Server-side authoritative seat calculations (Free ₹0, Pro ₹499/mo, Business ₹999/mo with ₹50/user/mo extra seat expansion).
- Automated schedulers: `BillingRenewalScheduler` executes daily recurring mandate sweeps, and `BillingReconciliationScheduler` automatically reconciles pending checkout orders against gateway records.

### 8. Programmatic Secret API & Webhooks
- Provides an API-key-authenticated interface (`ApiKeyGuard` with `wk_live_...` prefix) for automated CI/CD deployment pipelines.
- Requires mandatory audit justification parameters on programmatic secret reveals.
- Outgoing webhook dispatcher transmits signed event notifications (`secret.created`, `secret.revealed`, `session.created`, `session.revoked`) to organization endpoints.

---

## Screenshots

> *Note: Screenshot placeholders are documented below (`docs/screenshots/`). Real dashboard captures can be embedded prior to public demonstration.*

- **Vault & Secret Management:** `docs/screenshots/vault-secrets-management.png`
- **Delegated Access Approval Workflow:** `docs/screenshots/delegated-access-approval.png`
- **Zero-Exposure Extension Autofill:** `docs/screenshots/extension-zero-exposure-fill.png`
- **Real-Time Team Presence Monitor:** `docs/screenshots/team-presence-monitor.png`
- **Super Admin Platform Overview:** `docs/screenshots/superadmin-overview.png`

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo Engine** | [Turborepo 2.10](https://turbo.build/), [npm Workspaces](https://docs.npmjs.com/cli/using-npm/workspaces), [TypeScript 5.9](https://www.typescriptlang.org/) |
| **Backend API** | [NestJS 11](https://nestjs.com/), [Express 5](https://expressjs.com/), [Passport JWT](http://www.passportjs.org/), [Terminus](https://docs.nestjs.com/recipes/terminus), Node.js 20+ runtime |
| **Database & ORM** | [PostgreSQL 15](https://www.postgresql.org/) (Neon Serverless), [Prisma ORM 6](https://www.prisma.io/) |
| **Caching & Throttling** | [Redis 7](https://redis.io/) ([ioredis 5.11](https://github.com/redis/ioredis)), [rate-limit-redis 6.0](https://github.com/express-rate-limit/rate-limit-redis), [@nestjs/throttler 6.5](https://github.com/nestjs/throttler) |
| **Security & Cryptography** | [Argon2id](https://github.com/ranisalt/node-argon2), [AES-256-GCM](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options), RS256 Asymmetric JWT, Helmet 8, Cookie-Parser |
| **Frontend Web App** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Standalone Output), [React 19](https://react.dev/) |
| **Styling & Motion** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Lenis 1.3](https://github.com/darkroomengineering/lenis) smooth scrolling |
| **State & Data Fetching** | [TanStack React Query 5.101](https://tanstack.com/query/latest), [Axios 1.18](https://axios-http.com/) |
| **Browser Extension** | Chrome Manifest V3, [esbuild 0.20](https://esbuild.github.io/), Chrome Alarms API, Chrome Storage API, MutationObservers |
| **Payment Gateway** | [HDFC SmartGateway (Juspay)](https://smartgateway.hdfcbank.com/), HMAC-SHA256 signature verification |
| **Email & OTP Delivery** | [Google Workspace OAuth 2.0](https://developers.google.com/gmail/api), [Nodemailer 9.0](https://nodemailer.com/), [Resend 6.28](https://resend.com/) |
| **Validation & Testing** | [Zod 3.25](https://zod.dev/), [Jest 30](https://jestjs.io/), [ts-jest 29.2](https://kulshekhar.github.io/ts-jest/), [Supertest 7.0](https://github.com/ladjs/supertest), [ESLint 9](https://eslint.org/) |
| **Containerization** | [Docker Compose](https://docs.docker.com/compose/), Multi-stage Docker builds |

---

## Architecture Overview

WITHUS is architected around the core principle of **separating raw credential persistence from operator visibility**, ensuring zero plaintext credential exposure across network, storage, DOM, and memory vectors.

### High-Level System Architecture

```
                                  +---------------------------------------+
                                  |         Google Chrome Browser         |
                                  |                                       |
                                  |  +---------------------------------+  |
                                  |  |   WITHUS Extension (MV3)        |  |
                                  |  |   - Service Worker (Alarms)     |  |
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

### Request Flow & Execution Cycles

1. **Access Request Cycle:** The grantee selects a credential and submits a request. The grantor approves, generating a `DelegatedSession` with an active TTL.
2. **Session Launch Cycle:** The grantee navigates to the target login page. The extension content script detects the platform host and queries the background service worker via `GET_ACTIVE_SESSION`.
3. **Autofill Execution Cycle:** The service worker validates the user's JWT, obtains an ephemeral launch token, decrypts the DEK, decrypts the payload, and transmits credentials to the content script.
4. **DOM Injection & Guard Cycle:** The content script applies `-webkit-text-security: disc`, locks the input type, sets input values using prototype descriptors, hides eye-icons, and clears credential variables from memory.
5. **Headless OTP Polling Cycle:** If a two-factor challenge is detected, the extension invokes `/sessions/:id/otp`. The API queries the grantor's connected Gmail account via OAuth, runs regex pattern matching, and returns the OTP to the extension for automatic fill.
6. **Presence & Heartbeat Cycle:** A 30-second `chrome.alarms` listener collects active tab URLs, deduplicates them by `orgId::platform`, and sends a heartbeat to `/presence/heartbeat` to populate real-time activity dashboards.

---

## Cryptographic Vault & Envelope Encryption Pipeline

All secrets stored in WITHUS are governed by a two-tier key hierarchy managed by `EncryptionService` (`apps/api/src/vaults/encryption.service.ts`):

```
+-------------------------------------------------------------+
| Master Encryption Key (MEK)                                 |
| - 256-bit root key stored in VAULT_ENCRYPTION_KEY env var   |
| - Never persisted in database or written to disk            |
+-------------------------------------------------------------+
                              |
                     Encrypts / Decrypts
                              v
+-------------------------------------------------------------+
| Data Encryption Key (DEK)                                   |
| - Ephemeral 256-bit symmetric key per secret version        |
| - Generated via crypto.randomBytes(32)                      |
| - Stored encrypted (encryptedDEK, dekIv, dekAuthTag)        |
+-------------------------------------------------------------+
                              |
                     Encrypts / Decrypts
                              v
+-------------------------------------------------------------+
| Secret Payload (Ciphertext)                                 |
| - Encrypted with DEK using AES-256-GCM                      |
| - Authenticated using Contextual AAD:                       |
|   "${organizationId}:${vaultId}:${secretId}:${version}"     |
| - 96-bit CSPRNG IV + 128-bit Authentication Tag             |
+-------------------------------------------------------------+
```

### AAD Context Serialization
To prevent ciphertext relocation attacks (e.g., modifying database UUIDs to shift encrypted secrets into an unauthorized tenant's vault), contextual metadata is passed to AES-GCM as Additional Authenticated Data:

```typescript
computeAAD(context: EncryptionContext): Buffer {
  const serialized = `${context.organizationId}:${context.vaultId}:${context.secretId}:${context.version}`;
  return Buffer.from(serialized, 'utf8');
}
```

If any portion of the organization ID, vault ID, secret ID, or version counter is manipulated in database storage, tag verification fails immediately and throws a decryption exception.

---

## Zero Raw Exposure DOM Shielding Engine

The Chrome extension content script (`apps/extension/src/content/autofill.ts`) enforces multiple defensive barriers on third-party login pages:

### 1. Prototype Setter Injection
To bypass JavaScript framework state wrappers (React synthetic events, Vue reactive bindings), fields are filled by invoking the native DOM property descriptor directly:

```typescript
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  'value'
)?.set;

nativeInputValueSetter?.call(targetInput, credentialValue);
targetInput.dispatchEvent(new Event('input', { bubbles: true }));
targetInput.dispatchEvent(new Event('change', { bubbles: true }));
```

### 2. Continuous Input Type-Locking
A persistent `MutationObserver` traps any external script or browser inspection tool that attempts to mutate `type="password"` to `type="text"`:

```typescript
new MutationObserver(mutations => {
  for (const m of mutations) {
    const el = m.target as HTMLInputElement;
    if (m.oldValue?.toLowerCase() === 'password' && el.type !== 'password') {
      el.type = 'password';
    }
  }
}).observe(document.documentElement, {
  subtree: true,
  attributes: true,
  attributeFilter: ['type'],
  attributeOldValue: true,
});
```

### 3. Password Box Eye-Icon Suppression
Bounding-box proximity scans identify interactive buttons, spans, or SVGs situated adjacent to password fields, permanently hiding them:

```css
input[type="password"], #password {
  -webkit-text-security: disc !important;
  user-select: none !important;
}
input::-ms-reveal, input::-ms-clear { display: none !important; }
```

---

## Automated Headless Gmail OTP Extraction Pipeline

When multi-factor authentication is required, `GmailOtpService` (`apps/api/src/integrations/gmail/gmail-otp.service.ts`) executes an automated extraction pipeline:

1. **Authorization Check:** Verifies active session validity, non-expired status, and grantor Gmail OAuth token availability.
2. **Timestamp-Bounded Mailbox Query:** Polls messages matching `after:${loginStartTime}` to ignore previously consumed OTP emails.
3. **Pattern Matching Hierarchy:** Iterates through `OTP_PATTERNS` in order of specificity:
   - **Platform-Specific Patterns:** Matches target provider ID (e.g. `GITHUB`, `STRIPE`, `SHOPIFY`, `RAZORPAY`, `GODADDY`, `LINKEDIN`, `VERCEL`).
   - **Sender-Domain Patterns:** Matches sender domain (e.g. `accounts.google.com`).
   - **Generic Keyword Fallback:** Standalone 4- to 8-digit numeric token bounded by negative lookbehinds (e.g. `(?<![a-zA-Z0-9-])(\b\d{4,8}\b)`).
4. **Secure Return:** Extracted code is delivered over encrypted HTTPS to the extension, triggering automatic input filling and submission.

---

## Capability Enforcement & UI Shielding System

When a user operates inside a delegated third-party dashboard under a restricted session, `capability-enforcer.ts` injects tenant-defined CSS redaction rules to prevent unauthorized actions:

- **GitHub:** Hides `a[data-tab-item="settings"]`, `a[data-tab-item="security"]`, repository transfer controls, and collaborator invite menus.
- **Vercel:** Hides team settings, billing sections, and environment variable configuration forms.
- **Stripe:** Redacts the Developers menu, API keys, webhook configurations, and banking details.
- **Razorpay:** Hides API keys, webhook endpoints, and balance settlement forms.
- **Shopify:** Conceals store settings, payment providers, and user management screens.
- **GoDaddy:** Hides renewal settings, payment methods, and account profile controls.

---

## Enterprise Billing & Reconciliation Engine

The billing subsystem (`apps/api/src/billing/`) manages subscription lifecycles through HDFC SmartGateway (Juspay API):

### Subscription Plans & Entitlements

| Plan | Monthly Base | Annual Base | Included Users | Additional User Rate | Platform Entitlement | Capability UI Redaction |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Free** | ₹0 | ₹0 | 2 users | N/A | Any 2 of 11 platforms | No |
| **Pro** | ₹499/mo | ₹4,990/yr | 5 users | ₹50/user/mo (₹500/yr) | All 11 platforms | No |
| **Business**| ₹999/mo | ₹9,990/yr | 15 users | ₹50/user/mo | All 11 platforms | **Yes (Full Module Control)** |

### Schedulers & Reconciliation
- **`BillingRenewalScheduler`:** Executes a daily sweep to process recurring mandate payments for active subscriptions nearing expiration.
- **`BillingReconciliationScheduler`:** Periodically queries the HDFC SmartGateway order status API for checkouts stuck in pending states, recovering or expiring them without administrator intervention.
- **HMAC-SHA256 Verification:** Inbound webhook payloads from HDFC are checked against `HDFC_RESPONSE_KEY` before modifying subscription statuses.

---

## Security & Data Integrity

- **Password Hashing:** Implemented with `Argon2id` via `HashService` (`packages/security/src/hash.ts`) configured with `memoryCost: 65536` (64 MB), `timeCost: 3`, and `parallelism: 1`.
- **Token Family Rotation:** Refresh tokens store `familyId` and track `replacedByTokenId`. If a previously consumed refresh token is presented, the entire token family is immediately revoked to neutralize token replay attacks.
- **Strict CORS Policy:** Wildcard origins (`*`) are prohibited; only explicit, exact-match client origins defined in configuration are accepted.
- **Double-Submit CSRF Defense:** Authenticated state-changing endpoints require matching cryptographic tokens presented via HTTP-only cookies and custom request headers.
- **Active Membership Verification:** All session launch, secret reveal, and OTP endpoints join against `OrganizationMember` to ensure suspended or offboarded users are instantly blocked.

---

## Database Design

The data layer uses PostgreSQL managed through Prisma ORM (`packages/db/prisma/schema.prisma`).

```mermaid
erDiagram
    Organization ||--o{ OrganizationMember : "has many (cascade delete)"
    Organization ||--o{ Vault : "has many (cascade delete)"
    Organization ||--o{ DelegatedSession : "has many (cascade delete)"
    Organization ||--o| Subscription : "has one (1:1)"
    Organization ||--o{ AuditEvent : "logs activity"
    User ||--o{ OrganizationMember : "has many (cascade delete)"
    User ||--o{ RefreshToken : "has many (cascade delete)"
    User ||--o{ DelegatedSession : "grantor / grantee"
    Vault ||--o{ Secret : "has many (cascade delete)"
    Secret ||--o{ SecretVersion : "has many (cascade delete)"
    Secret ||--o{ DelegatedSession : "authorizes target"
    DelegatedSession ||--o{ ApprovalRequest : "originates from"
    Subscription ||--o{ Payment : "has many"

    Organization {
        string id PK "uuid()"
        string name
        string slug UK "Unique"
        json settings "Optional JSON"
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }

    User {
        string id PK "uuid()"
        string email UK "Unique"
        string fullName
        string passwordHash "Argon2id"
        boolean isActive "Default: true"
        boolean isSuperAdmin "Platform Flag"
        datetime lastLoginAt "Nullable"
        datetime createdAt
    }

    OrganizationMember {
        string id PK "uuid()"
        string organizationId FK "Indexed"
        string userId FK "Indexed"
        string role "OWNER | ADMIN | MEMBER"
        datetime joinedAt
        datetime lastActiveAt "Nullable"
    }

    RefreshToken {
        string id PK "uuid()"
        string userId FK "Indexed"
        string tokenHash UK "Unique hash"
        string familyId "Indexed for reuse detection"
        boolean isRevoked "Default: false"
        datetime expiresAt
    }

    Vault {
        string id PK "uuid()"
        string organizationId FK "Indexed"
        string name
        string description "Optional"
        string platformId "Nullable catalog link"
        datetime createdAt
    }

    Secret {
        string id PK "uuid()"
        string vaultId FK "Indexed"
        string name "Unique per vault"
        string type "SecretType enum"
        string status "ACTIVE | DISABLED | DELETED"
        string encryptedDek "Wrapped under MEK"
        datetime lastRevealedAt "Nullable"
        int revealCount
    }

    SecretVersion {
        string id PK "uuid()"
        string secretId FK "Indexed"
        int version "Unique per secret"
        string ciphertext "AES-256-GCM"
        string iv "96-bit CSPRNG"
        string authTag "128-bit GCM Tag"
        string algorithm "Default: AES-256-GCM"
        datetime createdAt
    }

    DelegatedSession {
        string id PK "uuid()"
        string organizationId FK "Indexed"
        string grantorId FK "User reference"
        string granteeId FK "User reference"
        string scope "VAULT | SECRET | INTEGRATION"
        string resourceId "Target resource UUID"
        string status "ACTIVE | REVOKED | EXPIRED"
        datetime expiresAt "TTL window"
        json capabilities "Module-level CSS rules"
    }

    ApprovalRequest {
        string id PK "uuid()"
        string organizationId FK "Indexed"
        string requesterId FK "User reference"
        string type "DELEGATED_SESSION"
        json requestPayload "Session parameters"
        string status "PENDING | APPROVED | REJECTED"
        datetime createdAt
    }

    Subscription {
        string id PK "uuid()"
        string organizationId FK "Unique (1:1)"
        string plan "FREE | PRO | BUSINESS"
        string billingCycle "MONTHLY | ANNUAL"
        string status "ACTIVE | PENDING | CANCELLED"
        string hdfcMandateId "Nullable mandate ref"
        int totalAmount "Calculated in INR"
        datetime currentPeriodEnd "Renewal date"
    }

    Payment {
        string id PK "uuid()"
        string subscriptionId FK "Indexed"
        string type "NEW_REGISTRATION | RECURRING"
        string status "PENDING | SUCCESS | FAILED"
        string hdfcOrderId "Unique order ref"
        int amount "Captured in INR"
        datetime createdAt
    }

    AuditEvent {
        string id PK "uuid()"
        string organizationId FK "Indexed"
        string actorId FK "Nullable user reference"
        string action "LOGIN | REVEAL | LAUNCH"
        string resourceType "Target entity type"
        string resourceId "Target entity UUID"
        json metadata "Contextual payload"
        datetime createdAt "Immutable timestamp"
    }
```

### Performance Indexes
- `refresh_tokens`: `@@unique([tokenHash])`, `@@index([userId, familyId])`, `@@index([userId, isRevoked])` — Scopes token lifecycle and speeds up family invalidation checks.
- `secrets`: `@@unique([vaultId, name])`, `@@index([vaultId, status])` — Accelerates vault listing and prevents duplicate secret naming.
- `secret_versions`: `@@unique([secretId, version])`, `@@index([secretId])` — Speeds up active revision resolution and cryptographic payload lookups.
- `delegated_sessions`: `@@index([granteeId, status])`, `@@index([organizationId, status])`, `@@index([resourceId])` — Powers extension domain matching and real-time dashboard queries.
- `audit_events`: `@@index([organizationId, createdAt])`, `@@index([actorId, action])` — Speeds up paginated governance audit views and filterable event timelines.
- `subscriptions`: `@@index([organizationId])`, `@@index([status])`, `@@index([currentPeriodEnd])` — Optimizes daily renewal sweeps (`BillingRenewalScheduler`).

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

## Installation & Local Development

### Prerequisites
- **Node.js:** `v20.x` or higher (LTS recommended)
- **Package Manager:** `npm` `10.8.2` or higher
- **PostgreSQL:** Accessible instance (local PostgreSQL 15+ or Neon Serverless)
- **Redis:** Local Redis 7+ instance on port 6379

### 1. Clone the Repository
```bash
git clone https://github.com/akshit-max/SDAP.git
cd SDAP
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Database Client
```bash
npx prisma generate --schema=packages/db/prisma/schema.prisma
```

### 4. Apply Database Migrations
```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

### 5. Running the Application

#### Option A: Full Monorepo Development Mode
Starts all services (API, Web Dashboard, Marketing, Docs) concurrently with hot-reloading:
```bash
npm run dev
```

#### Option B: Granular Service Execution
Run specific targets in isolated terminal instances:
```bash
# Terminal 1: Backend API (port 4000)
npm run dev -w api

# Terminal 2: Web Dashboard (port 3000)
npm run dev -w web

# Terminal 3: Extension watch bundler
npm run dev -w withus-extension
```

#### Option C: Docker Compose (Local Infrastructure)
Spin up PostgreSQL, Redis, and pgAdmin containers automatically:
```bash
docker compose up -d
```

### Loading the Extension into Google Chrome
1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `apps/extension/dist` directory.

---

## Environment Variables

### Core Variables (Always Required)

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (pooled connection, e.g. Neon) | `postgresql://user:pass@localhost:5432/sdap_db` |
| `VAULT_ENCRYPTION_KEY` | 32-byte Base64 encoded Master Encryption Key (MEK) | `node -e "console.log(crypto.randomBytes(32).toString('base64'))"` |
| `JWT_PRIVATE_KEY` | RSA Private Key for RS256 JWT signing (PEM string) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `JWT_PUBLIC_KEY` | RSA Public Key for RS256 JWT verification (PEM string) | `-----BEGIN PUBLIC KEY-----...` |
| `CORS_ORIGIN` | Exact frontend URL permitted for cross-origin requests | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Web dashboard API base endpoint URL | `http://localhost:4000/api/v1` |
| `WITHUS_API_URL` | Extension API connection endpoint URL | `http://localhost:4000/api/v1` |

### Conditional Variables (Feature-Dependent)

| Variable Name | Condition / Requirement | Default / Example |
| :--- | :--- | :--- |
| `HDFC_BASE_URL` | Required in production: HDFC SmartGateway API base endpoint | `https://smartgateway.hdfcbank.com` |
| `HDFC_MERCHANT_ID` | Required in production: HDFC SmartGateway Merchant Identifier | `WITHUS_PROD_MERCHANT` |
| `HDFC_API_KEY` | Required in production: HDFC Gateway API Secret Key | `sec_key_...` |
| `HDFC_RESPONSE_KEY` | Required in production: HMAC-SHA256 callback signature key | `res_key_...` |
| `HDFC_WEBHOOK_USERNAME`| Required in production: Basic Auth user for Juspay webhooks | `withus_wh_user` |
| `HDFC_WEBHOOK_PASSWORD`| Required in production: Basic Auth password for Juspay webhooks | `withus_wh_secure_password` |
| `GOOGLE_CLIENT_ID` | Required for Gmail OTP: OAuth 2.0 Client Identifier | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Required for Gmail OTP: OAuth 2.0 Client Secret | `GOCSPX-...` |

### Optional Configuration & Toggles

| Variable Name | Description | Default |
| :--- | :--- | :---: |
| `PORT` | Backend API HTTP server port | `4000` |
| `NODE_ENV` | Application runtime environment (`development`, `production`, `test`) | `development` |
| `REDIS_URL` | Redis connection URL for distributed rate limiting and presence | `redis://localhost:6379` |
| `RATE_LIMIT_TTL` | Sliding rate limiter time-to-live window in seconds | `60` |
| `RATE_LIMIT_LIMIT` | Maximum allowed requests per TTL window | `100` |
| `LANDING_URL` | URL of the separately deployed marketing landing page | `http://localhost:3002` |
| `HDFC_RECONCILE_MODE`| Reconciliation scheduler execution mode (`off`, `dry-run`, `live`) | `dry-run` |
| `BILLING_RENEWAL_SWEEP_ENABLED`| Toggles daily recurring mandate renewal sweep | `true` |

---

## Testing & Quality Assurance

The codebase enforces strict quality gates via Jest unit tests, TypeScript type checks, and security regression suites:

```bash
# Run complete test suite across all workspace packages
npm test

# Run API test suites specifically
npm test -w api

# Run TypeScript compile-time verification across all packages
npm run check-types

# Run ESLint analysis
npm run lint

# Production monorepo build verification
npm run build
```

### Verified Test Suite (56+ Tests across 8 Security Suites)

- `apps/api/src/vaults/encryption.service.spec.ts` (7 tests): Two-tier AES-256-GCM envelope encryption, DEK generation, AAD mismatch rejection, and zero-fingerprint storage.
- `apps/api/src/common/middleware/csrf-cors.security.spec.ts` (8 tests): Exact-match CORS allowlist verification, wildcard origin rejection, and double-submit CSRF token validation.
- `apps/api/src/sessions/sessions.service.membership.spec.ts` (6 tests): Active organization membership enforcement, preventing offboarded users from launching sessions or revealing secrets.
- `apps/api/src/billing/billing.security.spec.ts` (11 tests): HDFC SmartGateway HMAC-SHA256 signature verification, idempotent webhook replay protection, and authoritative seat calculation.
- `apps/api/src/integrations/gmail/gmail-otp.service.spec.ts` (5 tests): Regex pattern matching across 11+ providers, timestamp boundary enforcement, and fallback parsing.
- `apps/api/src/vaults/controllers/secrets.controller.tenant.spec.ts` (7 tests): Cross-tenant BOLA rejection and organization boundary verification on secret lookups.
- `apps/api/src/authorization/authorization.service.spec.ts` (6 tests): Role-to-permission mapping and membership resolution.
- `apps/api/src/auth/auth.service.spec.ts` (6 tests): Argon2id password hashing, RS256 token issuance, and refresh token family rotation.

### Test Scope & Limitations
- Unit and integration tests thoroughly validate cryptographic safety, tenant boundaries, rate limits, and failure handling.
- Third-party external endpoints (HDFC SmartGateway APIs, Google OAuth endpoints) are tested against simulated payloads and deterministic mocks to guarantee isolated, offline CI verification.

---

## Engineering Decisions & Trade-offs

### Envelope Encryption (AES-256-GCM) with Contextual AAD over Single Key Encryption
- **Trade-off:** Generating and storing encrypted DEKs increases database storage overhead by ~120 bytes per secret version and requires two cryptographic passes during decryption.
- **Decision:** Eliminates single-point database decryption breaches. Contextual AAD (`${orgId}:${vaultId}:${secretId}:${version}`) prevents attackers from relocating encrypted records between organizations in a compromised database.

### Prototype-Level DOM Injection over Synthetic Event Dispatch
- **Trade-off:** Direct prototype invocation bypasses certain modern browser autofill heuristics and requires custom DOM traversal logic.
- **Decision:** Guarantees compatibility with complex single-page application frameworks (React, Angular, Vue) whose internal state managers reject standard `.value = x` property assignments without synthetic event cycles.

### Headless Server-Side Gmail OAuth Polling over Client-Side Mail Scraping
- **Trade-off:** Grantors must complete a one-time Google OAuth authorization flow on the dashboard.
- **Decision:** Keeps the grantor's personal inbox completely hidden from team members while eliminating the need for manual, interruptive 2FA code relays over communication channels.

### Authoritative Server-Side Pricing over Client-Reported Seat Calculations
- **Trade-off:** Upgrading team seat counts requires an active backend round-trip to compute prorated order totals.
- **Decision:** Prevents malicious client-side tampering with payment amounts, subscription plans, or platform limits prior to HDFC SmartGateway order initialization.

### Chrome Alarms API over WebSockets for Extension Presence Heartbeats
- **Trade-off:** Presence updates are delivered at discrete 30-second intervals rather than sub-second continuous streams.
- **Decision:** Chrome Manifest V3 service workers automatically terminate after 30 seconds of inactivity. Persistent WebSockets disconnect upon worker suspension; `chrome.alarms` survive worker termination and consume zero background memory between ticks.

---

## Known Limitations

- **Chromium Desktop Scope:** The current browser extension is built specifically for Chromium-based desktop browsers (Google Chrome, Brave, Microsoft Edge). Mobile platforms (iOS Safari, Android Chrome) do not support desktop MV3 content script injection.
- **Third-Party Selector Volatility:** Platform autofill depends on CSS selectors in `platform-registry.ts`. Upstream redesigns by third-party services (e.g. GitHub or Shopify) require periodic selector reconciliation.
- **Single-Node Schedulers:** Billing renewal and reconciliation cron jobs run on NestJS instance timers. Clustered deployments with multiple API replicas require Redis Redlock synchronization to prevent duplicate scheduler execution.

---

## Future Improvements

- [ ] **Native Mobile Autofill Integration:** Native Android (`AutofillService`) and iOS (`ASCredentialProviderViewController`) credential provider extensions.
- [ ] **Distributed Queue Architecture:** Migrating recurring billing sweeps and email polling to BullMQ backed by persistent TCP Redis.
- [ ] **Hardware Security Keys (WebAuthn / FIDO2):** Support for YubiKey hardware tokens for administrative login and vault decryption approval.
- [ ] **Dynamic Remote Selectors:** Remote selector manifest distribution endpoint allowing zero-downtime selector updates without requiring Chrome Web Store releases.

---

## License

This repository is proprietary and confidential. All rights reserved. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
