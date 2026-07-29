# User Acceptance Testing (UAT) Checklist

This checklist is provided for the client to verify that the core functional requirements of the SDAP platform operate correctly in the production/staging environment.

## 1. Authentication & Organizations
- [ ] User can register a new account.
- [ ] User can create a new Organization.
- [ ] User can login and receive a valid JWT token.
- [ ] User can invite another user to their Organization.

## 2. RBAC & Permissions
- [ ] A user with `ADMIN` role can access all resources in the organization.
- [ ] A user with `MEMBER` role without explicit `SECRET_READ` permissions cannot read secrets directly.

## 3. Vault & Secret Lifecycle
- [ ] User can create a Vault.
- [ ] User can create a Secret inside the Vault (providing plaintext).
- [ ] User can view the Secret list (plaintext remains hidden).
- [ ] User can update a Secret (appending a new version).
- [ ] User can reveal a Secret (must provide a mandatory audit reason).
- [ ] User can soft-delete a Secret.

## 4. Delegated Sessions
- [ ] User can request a Delegated Session for a specific Secret.
- [ ] Granular scoped sessions restrict access solely to the requested Secret.
- [ ] Sessions expire automatically based on the requested TTL.
- [ ] User can manually revoke an active session early.
- [ ] Revoked sessions immediately reject attempts to reveal secrets.

## 5. Approval Workflows
- [ ] A session request triggers a `PENDING` approval if policy dictates.
- [ ] A manager can `APPROVE` the request (automatically issuing the session).
- [ ] A manager can `REJECT` the request (preventing session creation).
- [ ] The immutable state machine prevents re-approving a rejected request.

## 6. Audit Trail
- [ ] The Audit Log displays a chronological list of events.
- [ ] Revealing a secret records a `secret.revealed` event with the actor, resource, and reason.
- [ ] Event metadata is properly formatted and inspectable via the UI.
- [ ] Filtering by `Action` and `Actor ID` correctly narrows results.
