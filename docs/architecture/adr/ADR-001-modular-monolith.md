# ADR 001: Modular Monolith Architecture

## Status
Accepted

## Context
The SDAP platform needs to support a complex set of business logic spanning authentication, RBAC, organizations, credential vaulting, approvals, sessions, audit, and multi-platform integrations. We need an architecture that supports rapid iteration while remaining strictly maintainable and secure over the long term.

## Decision
We will use a **Modular Monolith** architecture built on **NestJS**.
The platform will initially deploy as a single API service (`apps/api`), but all code will be strictly organized into domain-specific modules. Modules must not directly call each other's databases or internal implementations. Shared logic is either exposed via explicit Module exports or communicated through Domain Events.

## Rationale
- **Velocity vs Scale**: A true microservices architecture introduces significant operational overhead (networking, distributed transactions, deployment complexity) that slows down initial development.
- **Maintainability**: NestJS enforces a modular structure out-of-the-box (Controllers, Services, Modules).
- **Future-proofing**: If a specific domain (like the Vault or Audit) needs to be extracted into its own service later, the modular boundaries and Dependency Injection in NestJS make this extraction much simpler.

## Consequences
- All developers must adhere strictly to the standardized module directory structure.
- Inter-module dependencies must be carefully managed to avoid circular dependencies.
- We must utilize Domain Events for side-effects (e.g., Audit Logging) rather than direct service coupling.
