# ADR 005: Authorization Model

## Status
Accepted

## Context
As the SDAP platform scales, simple static role-based access control (RBAC) (e.g., `if role == OWNER`) will become insufficient. Future requirements include custom roles, temporary permissions, enterprise policies, and delegated permissions. Hardcoding role checks in services limits scalability and increases maintenance overhead.

## Decision
We are adopting a **Policy-Based Authorization Architecture** with the following principles:

1. **Permission Registry (Single Source of Truth):** 
   All permissions are defined as strict TypeScript enums/constants (e.g., `Permission.MEMBER_INVITE`) rather than string literals. This ensures compile-time safety and centralized management.
   
2. **Context-Aware Evaluation:** 
   Authorization must consider the context: *Can User X perform Action Y on Resource Z within Organization W?* The core API takes a context payload: `{ userId, organizationId, permission, resourceId?, resourceType? }`.
   
3. **The Policy Resolver Chain:**
   The authorization flow is separated into distinct responsibilities:
   - **Access Control:** Controllers use `@RequirePermissions(Permission.MEMBER_INVITE)` which triggers a generic `PermissionsGuard`.
   - **PolicyResolver:** Determines the authorization context from the request (e.g., extracting `orgId` from route parameters).
   - **AuthorizationService (Entry Point):** Receives the context and orchestrates the check.
   - **MembershipResolver:** Resolves the user's membership and current role in the target organization.
   - **PermissionEvaluator:** Determines if the resolved role (or custom policy) grants the required permission.

## Consequences
- **Positive:** Roles no longer map directly to static permissions inside service business logic.
- **Positive:** Future modules can easily introduce new permissions by appending to the registry and adding the decorator.
- **Positive:** Supporting custom roles in the future only requires updating the `PermissionEvaluator` without touching any API controllers or domain services.
- **Negative:** Increased initial boilerplate for defining permissions and context resolvers compared to simple role checks.
