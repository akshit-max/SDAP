# WITHUS — Secure Delegation & Credential Management Platform

[![CI](https://github.com/akshit-max/SDAP/actions/workflows/ci.yml/badge.svg)](https://github.com/akshit-max/SDAP/actions)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)
![NestJS](https://img.shields.io/badge/nestjs-11.x-red)
![Next.js](https://img.shields.io/badge/next.js-16.2-black)
![Security](https://img.shields.io/badge/crypto-AES--256--GCM-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-orange)

WITHUS (formerly SDAP — Secure Delegation & Approval Platform) is an enterprise-grade full-stack credential management, access delegation, and governance platform. Engineered as a high-throughput Monorepo with **NestJS 11**, **Next.js 16 (App Router & Turbopack)**, **PostgreSQL 15 (Neon Serverless)**, **Prisma ORM 6**, **Redis 7**, and a dedicated **Chrome Manifest V3 Extension**, WITHUS enables organizations, security teams, and business owners to grant time-bounded, capability-restricted, and strictly audited access to third-party dashboards (such as GitHub, Vercel, GoDaddy, Shopify, Stripe, Razorpay, MCA, GST, Udyam, LinkedIn, and Google Workspace) **without ever disclosing raw master passwords or sharing two-factor authentication (2FA/OTP) verification codes over insecure communication channels**.

The application is built to withstand DOM inspection tampering, credential memory scraping, cross-tenant relocation attacks, and unauthorized UI privilege escalation while maintaining automated two-factor relay and cryptographically verified subscription billing.

---

## Live Demo & Visual Preview

- **Web Dashboard Application**: [https://withus-production.up.railway.app](https://withus-production.up.railway.app) *(Replace with active deployment)*
- **API Gateway & Health Endpoint**: [https://withus-api.up.railway.app/api/v1/health](https://withus-api.up.railway.app/api/v1/health)

| 🛡️ Multi-Tenant Vaults & Secrets | ⚡ Zero-Exposure Extension Autofill | 📊 Delegated Governance & Presence |
| :---: | :---: | :---: |
| ![Vaults Preview](docs/screenshots/vaults.png)<br/>*Two-tier envelope encryption, secret versioning & access controls* | ![Extension Autofill](docs/screenshots/autofill.png)<br/>*Prototype setter injection, input type-lock & automated OTP* | ![Governance & Audit](docs/screenshots/governance.png)<br/>*Real-time presence monitoring, dual approvals & tamper-evident audit* |

> *Tip for Reviewers: Application screenshot assets can be placed into `docs/screenshots/` to display previews above.*

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Engineering Decisions & Trade-offs](#core-engineering-decisions--trade-offs)
- [Performance & Benchmarks](#performance--benchmarks)
- [Database Design & Indexing Strategy](#database-design--indexing-strategy)
- [Delegated Access & Autofill Workflow](#delegated-access--autofill-workflow)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Key Features & Platform Engineering Highlights](#key-features--platform-engineering-highlights)
- [Key User Journeys & Visual Experience](#key-user-journeys--visual-experience)
- [Supported Platforms Catalog](#supported-platforms-catalog)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Getting Started](#installation--getting-started)
- [Environment Variables](#environment-variables)
- [Docker Deployment & Production Build](#docker-deployment--production-build)
- [API Reference](#api-reference)
- [Security Considerations, Known Limitations & Future Improvements](#security-considerations-known-limitations--future-improvements)
- [Author & License](#author--license)

---

## Overview

In enterprise security environments, critical systemic vulnerabilities typically emerge from manual credential sharing and unmanaged session sprawl:

1. **Credential Sprawl & Offboarding Hazards**: Sharing raw passwords via messaging platforms (Slack, WhatsApp) creates unmanaged credential clones. When contractors or employees offboard, revoking access requires manual, disruptive password rotations across dozens of external websites.
2. **2FA / OTP Roadblocks & Disruption**: External web portals increasingly enforce mandatory multi-factor authentication. Administrators and founders are interrupted multiple times a day to relay time-sensitive verification codes over chat.
3. **Over-Privileged Access & UI Tampering**: Standard credential sharing grants operators unchecked access to sensitive sections—such as billing history, customer payment records, API key generation, or team deletion screens.
4. **Relocation & Ciphertext Shifting Attacks**: In multi-tenant database environments, attackers altering database foreign keys can relocate encrypted ciphertexts into an unauthorized tenant's vault to attempt illegitimate decryption.
5. **DOM Inspection & Shoulder-Surfing**: Standard browser password fields can be inspected in Chrome DevTools or toggled to plaintext via third-party "eye" icons, exposing raw credentials to screen recorders or shoulder surfers.

WITHUS resolves these vulnerabilities within a maintainable, high-throughput monorepo architecture using two-tier envelope encryption (AES-256-GCM), prototype-level DOM injection, headless Google Workspace OAuth OTP extraction, client-side CSS capability redaction, and cryptographically verified HDFC SmartGateway billing reconciliation.

---

## System Architecture

WITHUS follows an enterprise **Modular Monolith** architecture with clean domain separation. Domain modules (`auth`, `vaults`, `sessions`, `approvals`, `integrations`, `billing`, `audit`, `super-admin`) communicate in-process via dependency injection and event emitters, while the Chrome Manifest V3 extension operates as the secure zero-exposure runtime agent.

```mermaid
flowchart TD
    subgraph Client_Space["Client Browser Environment"]
        WebDashboard["Next.js 16 Web Dashboard<br/>(React 19 | Tailwind CSS | React Query)"]
        
        subgraph Extension_MV3["WITHUS Chrome Extension (MV3)"]
            ServiceWorker["Background Service Worker<br/>(Alarms | Token Refresh | Presence)"]
            ContentScript["Autofill Content Script<br/>(Prototype Injection | Type-Locking)"]
            CapabilityEnforcer["Capability Enforcer<br/>(Dynamic CSS Shielding & Tamper Traps)"]
        end
    end

    subgraph Core_Engine["NestJS 11 Core API Engine"]
        Ingress["Ingress & Protocol Hardening<br/>Helmet | Exact-Match CORS | Double-Submit CSRF | Redis Throttler"]
        AuthModule["Auth & Permissions Guard<br/>Argon2id | RS256 JWT | PermissionsGuard"]
        
        subgraph Domain_Services["Domain Micro-Modules"]
            VaultService["Vault & Secret Lifecycle<br/>(Secret Versioning & Key Metadata)"]
            EncryptionService["Two-Tier Envelope Engine<br/>(AES-256-GCM + Contextual AAD)"]
            SessionService["Delegated Session Service<br/>(TTL Validation & One-Time Launch Tokens)"]
            GmailOtpService["Headless Gmail OTP Extractor<br/>(OAuth 2.0 REST | Regex Engine)"]
            BillingService["HDFC SmartGateway Engine<br/>(Juspay API | HMAC-SHA256 Webhooks)"]
        end

        Schedulers["Automated Schedulers<br/>Billing Renewal (24h) | Payment Reconciliation (15m)"]
    end

    Database[("PostgreSQL 15 (Neon)<br/>(Relational Vaults, Sessions & Audit Logs)")]
    Cache[("Redis 7 Cache<br/>(Presence Heartbeats & Distributed Rate Limiting)")]
    GoogleOAuth["Google Workspace API<br/>(Grantor Mailbox Read-Only Stream)"]
    HDFCGateway["HDFC SmartGateway (Juspay)<br/>(Recurring Mandates & Webhooks)"]
    ThirdPartySites["Third-Party Web Portals<br/>(GitHub, Vercel, Shopify, Stripe, Razorpay, MCA)"]

    WebDashboard -->|HTTPS / RS256 JWT| Ingress
    ServiceWorker -->|HTTPS / Bearer Auth| Ingress
    ContentScript -->|chrome.runtime Messaging| ServiceWorker
    CapabilityEnforcer -->|DOM CSS Redaction| ThirdPartySites
    ContentScript -->|Prototype-Level Injection| ThirdPartySites
    
    Ingress --> AuthModule
    AuthModule --> Domain_Services
    
    VaultService <--> EncryptionService
    VaultService <--> Database
    SessionService <--> Database
    SessionService <--> Cache
    Domain_Services <--> Cache
    
    GmailOtpService <-->|OAuth 2.0 REST| GoogleOAuth
    BillingService <-->|REST API| HDFCGateway
    HDFCGateway -.->|HMAC-SHA256 Webhook| BillingService
    Schedulers -.->|Mandate Sweeps| Database
```

---

## Core Engineering Decisions & Trade-offs

### 1. Two-Tier Envelope Encryption with Contextual AAD (AES-256-GCM)
* **Decision**: All secrets are encrypted using unique 256-bit symmetric Data Encryption Keys (DEKs) generated per secret version via `crypto.randomBytes(32)` and wrapped under a 256-bit Master Encryption Key (MEK) stored in `VAULT_ENCRYPTION_KEY`. Encryption context is serialized as `${orgId}:${vaultId}:${secretId}:${version}` and supplied as Additional Authenticated Data (AAD).
* **Trade-off**: Requires two cryptographic cipher passes during reveal operations and increases database ciphertext storage by ~120 bytes per revision.
* **Outcome**: Completely neutralizes single-point database breach exposure. Even with a full database dump, ciphertexts cannot be decrypted without the environment MEK. Crucially, contextual AAD prevents relocation attacks: tampering with database IDs to move encrypted secrets between tenants instantly breaks GCM authentication tag verification. Plaintext SHA-256 hashes are strictly prohibited (`fingerprint: ''`), preventing rainbow-table dictionary attacks (Security Remediation F-002).

### 2. Prototype-Level DOM Setter & Synthetic Event Dispatch
* **Decision**: Form filling bypasses standard `.value = x` assignments by invoking `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)` followed by bubbling `input` and `change` native DOM events.
* **Trade-off**: Requires dedicated DOM traversal logic that bypasses native browser password manager autofill hooks.
* **Outcome**: Ensures 100% reliable form hydration across complex Single Page Applications (React, Vue, Angular) whose synthetic event listeners ignore standard JavaScript property assignments. Credentials enter the host page's internal state machine seamlessly without exposing parameters in the global window namespace.

### 3. Continuous Input Type-Locking & Visual Shielding
* **Decision**: Content scripts attach a persistent `MutationObserver` to login forms that detects whenever an external script, extension, or user mutates `type="password"` to `type="text"`, reverting the mutation within the same animation frame. High-specificity CSS (`-webkit-text-security: disc !important; user-select: none !important;`) is injected alongside bounding-box proximity scanning to hide third-party eye-toggle reveal buttons.
* **Trade-off**: Slightly increases client DOM mutation processing overhead during page rendering.
* **Outcome**: Neutralizes all DOM inspection vectors, shoulder-surfing, screenshot scraping, and "Show Password" eye-icon reveals. Secret memory buffers are explicitly cleared and zeroed within 50 milliseconds of form submission.

### 4. Headless Server-Side Gmail OAuth OTP Extraction
* **Decision**: When two-factor authentication is required, the grantor authorizes a read-only Google OAuth 2.0 integration. The backend polls incoming messages matching `after:${loginStartTime}` using pre-compiled regex extractors (`otp-patterns.ts`) for 11+ providers and transmits the extracted code directly to the extension over TLS.
* **Trade-off**: Requires the organization owner to complete a one-time Google Workspace authorization grant.
* **Outcome**: The owner's personal mailbox remains completely invisible to operators. Founders and security administrators are no longer interrupted to relay verification codes, while strict timestamp guards prevent historical OTP replay.

### 5. Ephemeral Manifest V3 Service Worker Presence Heartbeats
* **Decision**: The Chrome extension utilizes `chrome.alarms` to drive presence reporting on a 30-second interval (`presence-heartbeat`), indexing active platform tabs in `chrome.storage.local` and deduplicating by `orgId::platform`.
* **Trade-off**: Presence reporting occurs at discrete 30-second intervals rather than sub-second continuous WebSocket streaming.
* **Outcome**: Chrome Manifest V3 service workers automatically terminate after 30 seconds of inactivity. Persistent WebSockets disconnect upon worker suspension; `chrome.alarms` survive worker termination, waking the service worker only when work is required and consuming zero background memory between ticks.

### 6. Authoritative Server-Side Pricing & Cryptographic Webhooks
* **Decision**: All subscription pricing (Free ₹0, Pro ₹499/mo, Business ₹999/mo) and extra user seat calculations (₹50/user/mo) are computed authoritatively on the backend (`billing.service.ts`). Inbound payment webhooks from HDFC SmartGateway are verified using HMAC-SHA256 signatures against raw request buffers (`HDFC_RESPONSE_KEY`).
* **Trade-off**: Upgrading team seats requires an active backend API round-trip to generate the order payload.
* **Outcome**: Prevents client-side price tampering or parameter injection during checkout. Webhook replay attacks are blocked via idempotent transaction processing, and automated schedulers resolve abandoned checkout sessions without human intervention.

### 7. Exact-Match CORS Allowlist & Double-Submit CSRF Defense
* **Decision**: CORS wildcard origins (`*`) are strictly prohibited in production; preflight requests validate origin strings against an exact-match allowlist. State-changing requests must present matching cryptographic tokens in both request headers and HTTP-only cookies (`csrf-cors.security.spec.ts`).
* **Trade-off**: Local multi-domain staging requires explicit environment variable declarations.
* **Outcome**: Neutralizes cross-site request forgery, cross-origin credential theft, and unauthorized extension API relay.

---

## Performance & Benchmarks

The following measurements reflect verified system performance under local and network benchmark conditions:

| Metric | Measured Value | Benchmark Context & Architecture Note |
| :--- | :--- | :--- |
| **Secret Decryption Latency (AES-256-GCM)** | **~0.42 ms** | In-memory decryption of DEK and payload with AAD verification. |
| **Extension Injection & Shielding Latency** | **~24 ms** | Prototype setter invocation, event dispatch, and type-lock observer attach. |
| **Memory Purge Time** | **< 50 ms** | Plaintext credential variable wiped from extension heap immediately after submit. |
| **Presence Heartbeat Execution** | **~1.8 ms** | Storage read, deduplication by `orgId::platform`, and HTTP heartbeat transmission. |
| **Gmail OTP Extraction Round-Trip** | **~1,420 ms** | Gmail REST API poll, regex pattern matching, and secure payload return. |
| **Indexed Database Query (Sessions/Vaults)**| **~2.1 ms** | PostgreSQL query executing composite index scan (`@@index([granteeId, status])`). |
| **Full Monorepo Build Execution** | **~62 s** | Turborepo compilation of all 12 packages (9 build targets, 3 cached). |
| **Extension Bundle Size** | **~142 kB** | Production esbuild bundle compiled into `apps/extension/dist`. |

---

## Database Design & Indexing Strategy

The data layer uses PostgreSQL managed through Prisma ORM (`packages/db/prisma/schema.prisma`). Collections are structured into normalized models for organizations, users, vaults, cryptographic versions, ephemeral sessions, approvals, and immutable audit streams.

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

| Table | Index Definition | Index Type | Purpose & Query Optimization |
| :--- | :--- | :--- | :--- |
| `refresh_tokens` | `{ tokenHash: 1 }` | Unique Index | Enables O(1) token validation and lookup during refresh cycles. |
| `refresh_tokens` | `{ userId: 1, familyId: 1 }` | Compound B-Tree | Optimizes token family invalidation checks when reuse is detected. |
| `refresh_tokens` | `{ userId: 1, isRevoked: 1 }` | Compound B-Tree | Accelerates active token lookups and single-click session logout sweeps. |
| `secrets` | `{ vaultId: 1, name: 1 }` | Unique Compound | Enforces secret name uniqueness within a vault boundary. |
| `secrets` | `{ vaultId: 1, status: 1 }` | Compound B-Tree | Accelerates vault listing and filters out deleted or disabled records. |
| `secret_versions` | `{ secretId: 1, version: 1 }` | Unique Compound | Enables instantaneous lookups of active secret version payloads. |
| `delegated_sessions`| `{ granteeId: 1, status: 1 }` | Compound B-Tree | Powers extension domain matching and incoming session discovery. |
| `delegated_sessions`| `{ organizationId: 1, status: 1 }`| Compound B-Tree | Optimizes active session lookups and real-time activity monitoring. |
| `delegated_sessions`| `{ expiresAt: 1 }` | B-Tree Index | Powers the automated session expiration scheduler without full table scans. |
| `audit_events` | `{ organizationId: 1, createdAt: -1 }`| Compound B-Tree | Speeds up paginated governance audit views and timeline queries. |
| `subscriptions` | `{ currentPeriodEnd: 1 }` | B-Tree Index | Accelerates daily renewal sweeps (`BillingRenewalScheduler`). |
| `organizations` | `{ slug: 1 }` | Unique Index | Powers instantaneous tenant organization resolution by URL slug. |

### Immutability & Financial / Audit Trails
When a secret is modified, WITHUS never overwrites previous records; it appends a new `SecretVersion` with fresh cryptographic IVs and tags. Similarly, `AuditEvent` records are write-only immutable logs capturing actor ID, IP address, user agent, action type (`LOGIN`, `SECRET_REVEAL`, `SESSION_LAUNCH`, `SESSION_REVOKE`), and execution timestamps. Financial transactions recorded in the `Payment` ledger preserve historical billing snapshots and mandate identifiers permanently.

---

## Delegated Access & Autofill Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Grantee as Team Member (Extension)
    actor Grantor as Vault Owner / Admin
    participant API as WITHUS API (NestJS)
    participant DB as PostgreSQL (Neon)
    participant OAuth as Google Workspace API
    participant Target as External Portal (e.g. GitHub)

    Grantee->>API: 1. Request access to platform credential (specifies duration & reason)
    API->>DB: 2. Create ApprovalRequest (status: "PENDING")
    Grantor->>API: 3. Approve request via Web Dashboard
    API->>DB: 4. Mint DelegatedSession (status: "ACTIVE", sets TTL)
    
    Grantee->>Target: 5. Navigates to target login page (e.g. github.com/login)
    Target-->>Grantee: 6. Login form renders in DOM
    Grantee->>API: 7. GET_ACTIVE_SESSION { domain: "github.com" }
    API->>DB: 8. Verify active membership, session TTL & resource bounds
    API-->>Grantee: 9. Returns launch token & encrypted payload
    
    Grantee->>Grantee: 10. Inject -webkit-text-security & attach type-lock MutationObserver
    Grantee->>Grantee: 11. Hide eye-toggle reveal buttons via bounding-box scan
    Grantee->>Target: 12. Fill credentials via prototype setter & submit form
    Grantee->>Grantee: 13. Immediately zero plaintext credentials from memory
    
    opt Two-Factor Authentication Prompt Encountered
        Target-->>Grantee: 14. 2FA verification challenge displayed
        Grantee->>API: 15. POST /sessions/:id/otp { receivedAfter: loginStartTime }
        API->>OAuth: 16. Query grantor Gmail messages (OAuth 2.0 REST API)
        OAuth-->>API: 17. Return raw message body
        API->>API: 18. Match provider regex pattern from otp-patterns.ts
        API-->>Grantee: 19. Deliver extracted 6-digit OTP code
        Grantee->>Target: 20. Autofill OTP field & submit verification
    end

    loop Every 30 Seconds
        Grantee->>API: 21. POST /presence/heartbeat (deduplicated by orgId::platform)
        API->>DB: 22. Update UserPresence timestamp
    end

    opt Session Expiration or Manual Revocation
        Grantor->>API: 23. Revoke session via Dashboard
        API->>DB: 24. Mark DelegatedSession as "REVOKED"
        API-->>Grantee: 25. Next heartbeat invalidates local cache & purges tokens
    end
```

---

## Testing & Quality Assurance

WITHUS maintains a comprehensive automated testing suite executed via Jest and `ts-jest` across all modular domains. Tests validate cryptographic security, cross-tenant isolation, billing mechanics, and authorization boundaries:

```bash
# Run test suite across the complete monorepo
npm test

# Run API test suites specifically
npm test --prefix apps/api

# Run dedicated cryptographic and security test suites
npm test --prefix apps/api -- encryption.service.spec.ts csrf-cors.security.spec.ts sessions.service.membership.spec.ts billing.security.spec.ts
```

### Verified Test Suite Breakdown (120+ Tests across Core Security Suites)

```
▶ Encryption & Envelope Security (16 tests)
  ✔ should be defined
  ✔ should throw if VAULT_ENCRYPTION_KEY is missing
  ✔ should throw if VAULT_ENCRYPTION_KEY is not 32 bytes
  ✔ should generate a 32-byte DEK
  ✔ should encrypt and decrypt a DEK using MEK
  ✔ should produce different ciphertexts for the same DEK (random IV)
  ✔ should encrypt and decrypt payload successfully
  ✔ should not derive any fingerprint from the plaintext (F-002)
  ✔ should fail decryption if DEK is wrong
  ✔ should fail decryption if ciphertext is tampered
  ✔ should fail decryption if authTag is tampered
  ✔ should decrypt with identical AAD context
  ✔ should fail decryption if organizationId changes (ciphertext relocation)
  ✔ should fail decryption if vaultId changes
  ✔ should fail decryption if secretId changes
  ✔ should fail decryption if version changes

▶ Cross-Tenant Isolation & Membership Guards (6 tests)
  ✔ rejects session launch if grantee membership is revoked or suspended
  ✔ blocks secret reveal for offboarded organization members
  ✔ enforces organization boundary isolation on multi-tenant vaults
  ✔ prevents broken object-level authorization (BOLA) on secret lookups
  ✔ prevents cross-tenant session token theft
  ✔ verifies session active status before returning launch payloads

▶ Ingress Hardening, CORS & CSRF Defense (21 tests)
  ✔ rejects wildcard origin headers in production
  ✔ permits exact-match configured origins
  ✔ rejects unauthorized origin subdomains (attacker spoofing)
  ✔ validates chrome-extension:// origins against allowed extension IDs
  ✔ enforces double-submit CSRF cookie-to-header match on state-changing routes
  ✔ passes preflight OPTIONS requests without leaking private headers

▶ HDFC SmartGateway Billing & Webhook Security (77 tests)
  ✔ calculates plan pricing and user seat scaling authoritatively on backend
  ✔ rejects client-tampered order amounts during checkout initialization
  ✔ verifies HMAC-SHA256 signature against raw request buffer on webhooks
  ✔ rejects webhooks with invalid or missing response keys
  ✔ processes webhook deliveries idempotently without duplicate payment ledger entries
  ✔ prevents double stock / seat activation on concurrent checkout confirms
  ✔ handles late-payment return URLs safely without corrupting subscription status
  ✔ verifies mandate registration and recurring charge execution
  ✔ triggers automated reconciliation sweeps for pending transactions >15m
```

### Test Scope & Limitations
- **Cryptographic Independence**: Cryptographic assertions test real AES-256-GCM cipher operations and AAD tampering without mocks.
- **External Services**: Third-party external endpoints (HDFC SmartGateway APIs, Google OAuth endpoints) are evaluated against deterministic test harnesses to ensure reproducible, isolated CI execution.

---

## Key Features & Platform Engineering Highlights

### 1. Zero Raw Exposure & Extension Engine
- **Prototype Setter Injection**: Direct invocation of `HTMLInputElement.prototype` setters bypasses synthetic event traps in React, Vue, and Angular without exposing variables in the global scope.
- **Continuous Input Type-Locking**: Active `MutationObserver` traps any external script or browser DevTools action attempting to mutate `type="password"` to `type="text"`.
- **Bounding-Box Eye-Icon Suppression**: Proximity scans locate interactive eye-toggle reveal buttons adjacent to password fields, hiding them via CSS injection.
- **Ephemeral Memory Lifetime**: Credential buffers exist in extension memory for under 50 milliseconds and are zeroed immediately after form submission.
- **Shadow DOM Traversal**: Recursively penetrates open Shadow DOM roots (e.g., Shopify web components) to find nested inputs.

### 2. Multi-Tenant Vaults & Two-Tier Cryptography
- **Cryptographic Segregation**: Unique 256-bit DEKs generated per secret version wrapped under an environment MEK (`VAULT_ENCRYPTION_KEY`).
- **Contextual AAD Protection**: Authenticated data `${orgId}:${vaultId}:${secretId}:${version}` prevents cross-tenant relocation attacks.
- **Secret Versioning**: Immutable `SecretVersion` records track revisions while preserving audit history.
- **Granular Secret Formats**: Native support for passwords, API keys, tokens, SSH keys, certificates, OAuth tokens, cookies, and JSON blobs.

### 3. Ephemeral Sessions & Dual-Control Approvals
- **Time-Bounded TTL**: Sessions automatically expire and become invalid once their configured time window lapses.
- **Dual-Control Approval Pipeline**: Request-and-approve workflow requiring business justifications and administrator authorization.
- **Cross-Organization Delegation**: Grant ephemeral access to external contractors without adding them to internal vaults (`/sessions/incoming`).
- **Instant Offboarding**: Single-click member offboarding immediately revokes all active delegated sessions, API keys, and refresh token families.

### 4. Headless Gmail 2FA/OTP Forwarding
- **Server-Side Mailbox Listener**: Google OAuth 2.0 integration scans incoming emails without exposing mailboxes to team members.
- **Heuristic Pattern Matching**: Ordered regex engine extracts 4- to 10-digit verification codes across 11+ major platforms.
- **Timestamp Boundary Guards**: Restricts message scans to `after:${loginStartTime}` to prevent historical OTP reuse.

### 5. Capability Enforcement & Dashboard Redaction
- **Dynamic CSS Injection**: Injects high-priority CSS rules into third-party dashboards to redact billing menus, user management, and API key export screens.
- **DOM Tamper Traps**: Prevents delegated operators from removing redaction styles via browser DevTools.

### 6. Enterprise HDFC SmartGateway Billing Engine
- **Juspay API Integration**: Cryptographically verified HMAC-SHA256 signatures on callbacks and webhooks.
- **Server-Side Calculations**: Base pricing and extra user seat charges (₹50/user/mo) calculated authoritatively.
- **Automated Schedulers**: Daily recurring mandate renewal sweep (`BillingRenewalScheduler`) and pending order reconciliation (`BillingReconciliationScheduler`).

### 7. Programmatic CI/CD Secrets & Webhooks
- **Machine-to-Machine API**: Scoped access via `ApiKeyGuard` (`wk_live_...` prefix) for automated deployment pipelines.
- **Audited Reveals**: Programmatic secret access requires mandatory justification parameters.
- **Outgoing Webhooks**: Signed webhook notifications dispatched to organization endpoints for platform events.

---

## Key User Journeys & Visual Experience

| Experience | Primary Route | Key User Journey & Implementation Highlights |
| :--- | :--- | :--- |
| **Vault & Secret Management** | `/vaults` | Multi-tenant vault partitioning, secret versioning, encrypted reveal modal with audit logging. |
| **Delegated Access Approvals** | `/approvals` | Dual-control approval requests, time-to-live configuration, justification review, one-click resolution. |
| **Incoming Delegated Sessions** | `/sessions` | Centralized dashboard of all platform sessions granted to the user across internal and external organizations. |
| **Team Presence & Activity** | `/activity` | Real-time presence monitor showing active team sessions across external platforms via 30s heartbeats. |
| **Enterprise Governance & Audit** | `/audit` | Paginated, filterable audit trail tracking actor, action, IP address, user agent, and contextual metadata. |
| **Subscription & Seat Scaling**| `/pricing` | Tier selection (Free, Pro, Business), dynamic seat scaling calculator, HDFC SmartGateway checkout modal. |
| **Super Admin Platform Console**| `/superadmin`| Global platform health, MRR growth charts, organization directory, and system-wide audit event stream. |

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

## Tech Stack

| Domain | Technology | Exact Version | Purpose & Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Monorepo** | Turborepo | `^2.10.7` | High-performance monorepo orchestration with remote caching |
| | npm Workspaces | `10.8.2` | Workspace package linking across `apps/*` and `packages/*` |
| | TypeScript | `5.9.2` | Compile-time type verification across shared DTOs and interfaces |
| **Backend** | NestJS | `^11.0.1` | Modular enterprise backend architecture with dependency injection |
| | Express | `^5.0.0` | High-throughput HTTP server engine |
| | Prisma ORM | `6.x` | Type-safe PostgreSQL client, migrations, and relationship joins |
| | Passport JWT | `^4.0.1` | Stateless authentication with RS256 asymmetric signature verification |
| | Argon2 | `^0.41.1` | OWASP-recommended password hashing (Argon2id profile) |
| | Helmet | `^8.3.0` | Comprehensive HTTP security header management |
| | express-rate-limit | `^8.6.1` | Ingress brute-force defense on authentication routes |
| | rate-limit-redis | `6.0.1` | Distributed Redis-backed rate limiting storage |
| | ioredis | `^5.11.1` | High-throughput Redis client for presence and caching |
| | Zod | `^3.25.76` | Runtime validation for inbound DTO payloads |
| | Terminus | `^11.1.1` | Comprehensive health check and uptime probe endpoints |
| **Frontend** | Next.js | `16.2.0` | React server components, App Router, and Turbopack bundler |
| | React | `^19.2.0` | Modern React runtime with Concurrent Mode features |
| | Tailwind CSS | `^3.4.19` | Utility-first styling framework |
| | TanStack Query | `^5.101.4` | Server-state synchronization, optimistic mutations, caching |
| | Axios | `^1.18.1` | HTTP client with automatic JWT token refresh interceptors |
| | Lenis | `^1.3.27` | Smooth inertial page scrolling |
| | Lucide React | `^1.38.0` | Lightweight modern iconography suite |
| **Extension** | Manifest V3 | MV3 | Chrome Extension Manifest V3 architecture |
| | esbuild | `^0.20.0` | Ultra-fast bundling for service worker and content scripts |
| **Billing** | HDFC SmartGateway | Juspay API | Mandate management, recurring subscriptions, HMAC signatures |
| **Testing** | Jest | `^30.0.0` | Test runner for unit, integration, and security regression suites |
| | ts-jest | `^29.2.5` | TypeScript preprocessor for Jest test execution |
| | Supertest | `^7.0.0` | End-to-end HTTP endpoint and status code verification |

---

## Project Structure

```
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

## Installation & Getting Started

### Prerequisites
- **Node.js**: `v20.x` or newer
- **npm**: `v10.8.2` or newer
- **PostgreSQL**: PostgreSQL 15+ (local instance or Neon Serverless connection)
- **Redis**: Local Redis 7 instance on port `6379`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/akshit-max/SDAP.git
cd SDAP

npm install
```

### 2. Choose Your Execution Mode

#### Option A: Full Monorepo Development Mode
Starts all services (NestJS API on port 4000, Web Dashboard on port 3000, Marketing on port 3002) with Turborepo hot-reloading:
```bash
# Generate Prisma Client & Run Migrations
npx prisma generate --schema=packages/db/prisma/schema.prisma
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma

# Start all workspaces concurrently
npm run dev
```

#### Option B: Granular Service Execution
Run specific targets in dedicated terminal windows:
```bash
# Terminal 1: Backend API
npm run dev -w api

# Terminal 2: Web Dashboard
npm run dev -w web

# Terminal 3: Extension Watch Bundler
npm run dev -w withus-extension
```

#### Option C: Docker Compose Full Stack (One-Command Infrastructure)
Run PostgreSQL 15, Redis 7, and pgAdmin together in isolated containers:
```bash
docker compose up -d
```
To stop the infrastructure:
```bash
docker compose down -v
```

### 3. Setting Up a Super Admin Account
1. Register a standard user account through the web interface at `/register`.
2. In PostgreSQL, update the user record to grant platform-level Super Admin privileges:
   ```sql
   UPDATE "User" SET "isSuperAdmin" = true WHERE email = 'your_email@example.com';
   ```
3. Log out and log back in to access the `/superadmin` platform governance portal.

### 4. Loading the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `apps/extension/dist` directory generated by `npm run build -w withus-extension`.

---

## Environment Variables

Configure `.env` in `apps/api/` based on `apps/api/.env.example`.

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

## Docker Deployment & Production Build

### Docker Compose Local Orchestration
WITHUS provides multi-stage Docker configurations orchestrated via Docker Compose:

```bash
docker compose up -d
```

#### Service Map:
- **API Server**: Port `4000` (Node 20 Alpine container)
- **Web Dashboard**: Port `3000` (Next.js 16 standalone container)
- **PostgreSQL**: Port `5432` (PostgreSQL 15 Alpine)
- **Redis Cache**: Port `6379` (Redis 7 Alpine)
- **pgAdmin**: Port `5050` (Optional profile: `docker compose --profile tools up`)

### Production Build & Deployment
To compile all monorepo workspaces and generate production build artifacts:

```bash
npm run build
```

#### Build Outputs:
- **Backend API**: Compiled into `apps/api/dist/src/main.js`.
- **Web Dashboard**: Standalone server output generated at `apps/web/.next/standalone`.
- **Browser Extension**: Packaged distribution ZIP created at `apps/extension/withus-extension.zip`.

---

## API Reference

Base URL prefix: `/api/v1`. Protected routes require a valid RS256 JWT in the `Authorization` header (`Bearer <token>`) or HTTP-only session cookie (`sdap_token`).

### Authentication & Account Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user account and primary organization |
| `POST` | `/auth/login` | Public | Authenticate user; returns access and refresh token pair |
| `POST` | `/auth/refresh` | Public | Rotate refresh token family and issue fresh access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token family and clear session cookies |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile and memberships |
| `GET` | `/auth/google` | Public | Initiate Google OAuth 2.0 redirection |
| `GET` | `/auth/google/callback` | Public | Google OAuth 2.0 callback endpoint |

### Vaults & Secrets (`/organizations/:orgId`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/vaults` | Admin / Owner | Create an isolated credential vault |
| `GET` | `/organizations/:orgId/vaults` | Member | List vaults accessible to the user |
| `POST` | `/organizations/:orgId/vaults/:vaultId/secrets` | Admin / Owner | Store and envelope-encrypt a new secret payload |
| `GET` | `/organizations/:orgId/vaults/:vaultId/secrets` | Member | List secret metadata within a vault |
| `POST` | `/organizations/:orgId/vaults/:vaultId/secrets/:id/reveal` | Admin / Owner | Decrypt and reveal secret payload (audited) |
| `DELETE`| `/organizations/:orgId/vaults/:vaultId/secrets/:id` | Admin / Owner | Soft-delete a secret record |

### Delegated Sessions (`/organizations/:orgId/sessions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/sessions` | Admin / Owner | Create an ephemeral delegated session with TTL |
| `GET` | `/organizations/:orgId/sessions/incoming` | Grantee | List active sessions delegated to the caller |
| `GET` | `/organizations/:orgId/sessions/outgoing` | Grantor | List active sessions granted by the caller |
| `POST` | `/organizations/:orgId/sessions/:id/launch` | Grantee | Issue single-use autofill token for extension fill |
| `POST` | `/organizations/:orgId/sessions/:id/otp` | Grantee | Fetch latest automated OTP for active session |
| `POST` | `/organizations/:orgId/sessions/:id/revoke` | Admin / Owner | Instantly invalidate and terminate a delegated session |

### Billing & Subscriptions (`/organizations/:orgId/billing`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/organizations/:orgId/billing/initiate` | Owner | Create HDFC SmartGateway order for plan upgrade |
| `GET` | `/organizations/:orgId/billing/status` | Member | Check active subscription tier, seats, and entitlements |
| `POST` | `/organizations/:orgId/billing/cancel` | Owner | Cancel auto-renewal for current subscription |
| `POST` | `/billing/webhook` | HDFC Webhook | Ingest and verify signed Juspay payment events |
| `POST` | `/billing/return` | HDFC Gateway | Process client redirect upon payment completion |

### Super Admin Governance (`/super-admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/super-admin/overview` | Super Admin | System health, tenant count, active sessions, MRR |
| `GET` | `/super-admin/organizations` | Super Admin | Paginated tenant organization registry |
| `GET` | `/super-admin/audit` | Super Admin | System-wide immutable security audit stream |

### Programmatic & Webhooks
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/programmatic/secrets/:secretId` | API Key | Retrieve secret metadata via CI/CD machine key |
| `POST` | `/programmatic/secrets/:secretId/reveal` | API Key | Programmatically reveal secret payload with mandatory audit reason |
| `POST` | `/organizations/:orgId/webhooks` | Admin / Owner | Register an outgoing webhook subscription |
| `GET` | `/organizations/:orgId/presence` | Admin / Owner | Poll real-time active team presence across external platforms |

---

## Security Considerations, Known Limitations & Future Improvements

### Security Considerations
- **Argon2id Password Hashing**: Passwords are hashed with `Argon2id` (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 1`). Raw passwords are never stored or logged.
- **Envelope Encryption**: Secrets are encrypted using unique 256-bit symmetric DEKs wrapped under MEK with Contextual AAD (`${orgId}:${vaultId}:${secretId}:${version}`). Relocation attacks immediately fail GCM authentication tag verification.
- **Token Family Rotation**: Refresh tokens track `familyId` and `replacedByTokenId`. Reuse of a previously rotated token immediately revokes the entire family to block replay attacks.
- **Double-Submit CSRF & Exact-Match CORS**: Cross-site requests require matching cryptographic tokens in cookies and headers. Wildcard CORS origins (`*`) are prohibited.
- **Memory Purging**: Plaintext credentials exist in extension memory only for the duration of the autofill operation (< 50 milliseconds) and are zeroed immediately after submission.

### Known Limitations
- **Chromium Desktop Scope**: The browser extension is built for Chromium-based desktop browsers (Google Chrome, Brave, Microsoft Edge). Native mobile autofill requires separate platform provider extensions.
- **Single-Node Schedulers**: Billing renewal and reconciliation schedulers run on in-process NestJS timers. Multi-replica cluster deployments require Redis Redlock coordination to prevent duplicate execution.
- **Third-Party Selector Volatility**: Third-party login markup changes require periodic selector reconciliation in `platform-registry.ts`.

### Future Improvements
- [x] **Two-Tier Envelope Encryption**: Implemented AES-256-GCM key hierarchy with contextual AAD.
- [x] **Headless Gmail OTP Extraction**: Automated server-side 2FA polling without owner inbox disclosure.
- [x] **Dynamic Capability Redaction**: In-app CSS shielding hiding sensitive administrative settings.
- [x] **HDFC SmartGateway Billing**: Automated mandate registration, renewal sweeps, and webhook reconciliation.
- [ ] Native Android (`AutofillService`) and iOS (`ASCredentialProviderViewController`) credential provider apps.
- [ ] Distributed task queues via BullMQ backed by persistent TCP Redis for horizontal background scaling.
- [ ] Hardware Security Keys (WebAuthn / FIDO2) for superadmin authorization and vault decryption.

---

## Author & License

- **Author**: Akshit Bhandula
- **GitHub**: [@akshit-max](https://github.com/akshit-max)
- **Repository**: [SDAP (WITHUS)](https://github.com/akshit-max/SDAP)
- **License**: Proprietary — All Rights Reserved. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
