# Project Roadmap

- [x] **Phase 0: Foundation** - Monorepo setup, shared packages, initial API scaffold.
- [x] **Phase 1: Authentication** - Registration, Login, Refresh token rotation, Replay detection.
- [x] **Phase 2: Organizations** - Organization CRUD, Membership, Invitation workflows. *(Pending live PostgreSQL verification)*
- [x] **Phase 3: RBAC** - Policy-based authorization, Permission registry, PermissionsGuard, role matrix.
- [x] **Phase 3.5: Stabilization** - Test fixes, security hardening (Helmet, CORS, exception filter), architecture corrections, cleanup.
- [ ] **Phase 4: Vault** - Versioned, encrypted secret storage with delegated access policies.
- [ ] **Phase 5: Applications** - Application registration and credential binding.
- [ ] **Phase 6: Sessions** - Active session management and revocation.
- [ ] **Phase 7: Audit** - Comprehensive audit logging for all security events.
- [ ] **Phase 8: Approval Engine** - Policy-based access requests and manager approvals.
- [ ] **Phase 9: Integrations** - Webhooks, external identity providers (SSO).
- [ ] **Phase 10: MVP Finalization** - Polish, end-to-end testing, readiness for v1.0.0.
