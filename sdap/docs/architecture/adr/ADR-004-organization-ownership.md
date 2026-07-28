# ADR 004: Organization Ownership and Boundary

## Status
Accepted

## Context
As the platform scales, almost every resource (Roles, Policies, Projects, Vaults, Invites) will belong to an `Organization`. We need a centralized and secure way to enforce multi-tenant isolation so that users in one organization cannot access or modify resources in another. Additionally, the creator of an organization must implicitly have full control over it without waiting for an advanced Role-Based Access Control (RBAC) system to be implemented.

## Decision
1. **Implicit Ownership**: When an organization is created, the system will automatically create an `OrganizationMember` record for the creator with the `MembershipRole` of `OWNER`. 
2. **Centralized Enforcement**: We are introducing the `OrganizationAccessService` which abstracts all authorization checks (e.g., `requireMembership(userId, orgId)`, `requireOwner(userId, orgId)`). 
3. **Audit Readiness**: All models, including `Organization` and `OrganizationMember`, have been extended to include `createdBy`, `updatedBy`, and `deletedBy` fields, establishing a permanent audit trail at the database level.
4. **Backend-Generated Slugs**: To prevent collisions and ensure data integrity, the backend solely owns the generation of organization slugs.

## Consequences
- **Positive**: Future modules (Vault, Approvals) simply inject `OrganizationAccessService` to enforce tenant isolation.
- **Positive**: The system is fully prepared for Phase 3 (RBAC) as the ownership primitive is already modeled through the `MembershipRole` enum.
- **Negative**: All API endpoints fetching or modifying organization resources must now explicitly pass both the `userId` and `orgId` to the `OrganizationAccessService` before querying the database, which adds slight boilerplate.
