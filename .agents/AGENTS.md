# WITHUS Project - Core Engineering Principles

These principles dictate all architectural and implementation decisions for the WITHUS project. They take precedence over implementation convenience.

## 1. Client Scope First
Implement only what is explicitly required by the client's roadmap. Do not introduce additional frameworks, generic abstractions for hypothetical futures, or unrequested optimizations.

## 2. Reuse Before Rewrite
Treat the existing production architecture as the reference implementation. Decision order:
1. Reuse the existing component unchanged.
2. Extend the existing component.
3. Wrap the existing component.
4. Abstract only minimal platform-specific logic.
5. Create a new component only as a last resort (must include technical justification).

## 3. Keep Existing Components
Preserve Authentication, Authorization, Vault, Credential Encryption, Delegated Access Workflow, Session Lifecycle, Audit Logging, Extension Messaging, and existing APIs.

## 4. Minimal Surface Area
Modify the fewest possible files. Avoid large refactors, file reorganizations, and breaking existing APIs.

## 5. Low Regression Policy
Minimize regression risk. Classify changes (No Risk, Low Risk, Medium Risk, High Risk). Always prefer Low Risk over Medium/High Risk solutions.

## 6. Configuration Over Code
Support new platforms by adding metadata, selectors, and configurations, not by duplicating the login workflow.

## 7. Preserve Existing Behaviour
GitHub, Vercel, and GoDaddy are reference implementations. Any behavioral difference in their login, autofill, or session workflows is a regression.

## 8. Avoid Premature Generalization
Do not build complex plugin systems, dynamic loaders, or overly generic dependency injection. Build only what the roadmap requires.

## 9. Preserve Simplicity
Reduce complexity and duplication. Avoid increasing abstraction without measurable benefit.

## 10. Regression Gate
No phase is complete until existing integrations (GitHub, Vercel, GoDaddy) pass perfectly. If a regression occurs, halt implementation, fix it, and re-test.

## 11. Dual Path Rule
Until a platform migration completely passes its dedicated regression gate, keep the Old Path and New Path available. Do not delete `if(GITHUB)` logic until regression confirms the abstraction works perfectly.

## 12. Complexity Budget
Every new abstraction must have a business justification. It must either:
1. Solve a client requirement.
2. Remove duplicated logic.
3. Reduce regression risk.

## 13. UI & UX Consistency (Mandatory)
Maintain the existing WITHUS design system. Follow the current spacing, typography, colors, shadows, border radius, and animations. Do not redesign existing pages. Match existing layouts.

## 14. Component Reuse First
Check whether an existing component already satisfies the requirement. Extend if appropriate. Create new only when no suitable reusable option exists.

## 15. Git Safety Rules & Commit Discipline (Mandatory)
- NEVER commit directly to `main`.
- NEVER push directly to `main`.
- NEVER push to `origin` unless explicitly requested by the user. Push ONLY to `personal`.
- All development must happen exclusively on `feature/platform-integration-framework`.
- Protect `stable-20260805` and `chrome-store-submitted-v1` tags. Do not rewrite their history.

## 16. Regression Rule
After every runtime commit, never rely only on build, TypeScript, or lint success. A phase is considered complete ONLY when manual regression passes, extension behavior matches the stable baseline identically, no console/API errors exist, and all existing supported platforms behave identically.

## PRE-COMMIT CHECKLIST
Before every commit, the AI must output the following questionnaire:
Did I modify existing logic? [YES / NO]
If YES, why couldn't I extend it?
Could this have been implemented by configuration? [YES / NO]
Which client requirement does this satisfy?
Regression Risk: [No / Low / Medium / High]
Files Modified/Added:

## PRE-PUSH CHECKLIST
Before every push, the AI must print:
Current Branch:
Files Modified:
Files Added:
Regression Status:
Build Status:
Destination Branch: (Must be feature/platform-integration-framework)

## Final Default Decision Criterion
When two solutions satisfy the requirements, **always** choose the one that reuses more existing code, modifies fewer files, introduces fewer abstractions, and has the lower regression risk.
