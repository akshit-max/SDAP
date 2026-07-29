# SDAP Architecture

SDAP (Secure Delegation & Approval Platform) is a monolithic platform utilizing a Domain-Driven Design (DDD) approach within a NestJS (Backend) and Next.js (Frontend) monorepo.

## System Components

### 1. The Monorepo (`@repo`)
- `apps/api`: NestJS backend. Serves as the sole authoritative gateway to the database and cryptographic operations.
- `apps/web`: Next.js frontend. A thin client orchestrating UI components and passing JWTs.
- `packages/db`: Prisma ORM schema and client generation.
- `packages/types`: Shared DTOs, Zod schemas, and TypeScript interfaces, guaranteeing contract drift cannot occur between the frontend and backend.
- `packages/ui`: Shared React components.

### 2. Backend Modules (DDD)

- **Auth & Organizations**: Manages JWT lifecycle and multi-tenant isolation (`OrganizationId`).
- **Authorization (RBAC)**: Enforces access control (e.g., `SECRET_READ`, `SECRET_WRITE`) using Guards (`PermissionsGuard`) and decorators (`@RequirePermissions`).
- **Vaults**: Manages the logical grouping of Secrets. Contains the `SecretLifecycleService` and `EncryptionService` for AES-256-GCM envelope encryption.
- **Sessions (Delegated Access)**: Allows granular, time-bound access to specific Secrets (bypassing strict organizational RBAC) via Temporary JWTs or internal session tracking.
- **Approvals**: A generic state machine (`ApprovalService`) enforcing dual-control workflows (e.g., requesting a Delegated Session requires a Manager's approval).
- **Audit**: An event-driven observability layer (`AuditListenerService`) that asynchronously persists chronological business events to the database without blocking primary transactions.

## Dependency Direction

Strict one-way dependency flow is enforced to prevent circular dependencies and maintain clean module boundaries:

`Approvals` -> `Sessions` -> `Vaults (Secrets)`

The Vault module does not know about Sessions. The Sessions module does not know about Approvals. 

## Event-Driven Architecture

SDAP uses `@nestjs/event-emitter` to decouple side effects (like Audit Logging) from core business logic.
- Services emit events (`secret.created`, `approval.approved`).
- Listeners (e.g., `AuditListenerService`) subscribe to these events and perform non-blocking operations.
