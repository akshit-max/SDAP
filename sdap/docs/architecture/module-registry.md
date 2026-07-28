# Module Registry

This registry tracks the responsibilities of each backend module to prevent domain leakage.

| Module | Responsibility | Dependencies |
|---|---|---|
| **UsersModule** | Manages user identity records (User table). Does not handle auth state. | `PrismaModule` |
| **AuthModule** | Orchestrates registration, login, token issuance, and validation. | `UsersModule`, `PrismaModule` |
| **OrganizationsModule** | *(Planned)* Manages organizations, membership links, and invitations. | `UsersModule`, `PrismaModule` |
