# Module Registry

This registry tracks the responsibilities of each backend module to prevent domain leakage.

| Module | Responsibility | Status | Dependencies |
|:---|:---|:---|:---|
| **UsersModule** | Manages user identity records (`User` table). Does not handle auth state. | ✅ Frozen | `PrismaModule` |
| **AuthModule** | Orchestrates registration, login, token issuance, refresh rotation, and replay detection. | ✅ Frozen | `UsersModule`, `PrismaModule` |
| **OrganizationsModule** | Manages organizations, membership links, and invitation workflows. | ✅ Provisionally Frozen (pending live DB verification) | `PrismaModule` |
| **AuthorizationModule** | Provides `PermissionsGuard`, `PolicyResolver`, `AuthorizationService`, and the `@RequirePermissions` + `@OrganizationContext` decorators. Global module. | ✅ Frozen | `PrismaModule` |
| **PrismaModule** | Wraps `PrismaClient` and manages the database connection lifecycle. | ✅ Frozen | — |
| **VaultModule** | *(Phase 4)* Manages versioned, encrypted secrets with delegated access policies. | 🔲 Planned | `PrismaModule`, `AuthorizationModule` |
| **ApplicationsModule** | *(Phase 5)* Application registration and credential binding. | 🔲 Planned | `VaultModule`, `AuthorizationModule` |
| **SessionsModule** | *(Phase 6)* Active session management and revocation. | 🔲 Planned | `AuthorizationModule` |
| **AuditModule** | *(Phase 7)* Event-driven audit logging for all security-sensitive operations. | 🔲 Planned | — |
| **ApprovalModule** | *(Phase 8)* Policy-based access request and approval workflows. | 🔲 Planned | `VaultModule`, `AuthorizationModule` |
