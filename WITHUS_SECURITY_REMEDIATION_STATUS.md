# WITHUS — Security Remediation Status (Handover Document)

> **This is the single source of truth for the ongoing WITHUS security remediation work.**
> It is meant to be self-sufficient: a new session should **not** need to re-audit the codebase.
> Read the whole document before changing any code, and update it after every approved remediation.

| | |
|---|---|
| Document created | 2026-11-10 |
| Last updated | 2026-11-10 (after F-001 verification) |
| Branch at creation | `latest-20261018` (HEAD `2a81115`) |
| Remediation status | **2026-11-10:** F-001, F-002, F-003, F-004, F-005, F-007 fixed (all uncommitted). **Pending:** F-002 historical-row cleanup (needs approval and a backup), F-006 (deferred), PITR claim verification, manual smoke tests before deploy. |

---

## ⚠️ 0. Instructions for Future Claude Code Sessions — READ FIRST

Before starting any security remediation:

1. **Read this document completely.**
2. **Inspect the current Git status and branch:** `git status`, `git branch --show-current`, `git log --oneline -10`.
3. **Check whether previous remediation work is already done.** Read the roadmap (§9) and the change log (§11), then confirm against the code.
4. **Never assume an old finding is still unresolved without checking the current code.** Line numbers in this document are as of HEAD `2a81115` and may drift.
5. **Never repeat completed work unnecessarily.**
6. **Preserve all existing developer changes.** Never reset, overwrite, or discard uncommitted work.
7. **Do not modify payment integrations without explicit user approval** (see §5).
8. **Make only targeted, minimal fixes.** No redesign, broad refactoring, renaming, or reformatting.
9. **Run focused regression tests** (§8). Do not run the full suite repeatedly for reassurance.
10. **Update this document after every approved remediation:** tick the item in §9, add a §11 entry, and record the tests run.

### What does NOT need re-auditing

The architecture facts in §2–§4 and the evidence and fix design for each finding in §6 were verified line-by-line on 2026-11-10. For a finding you are about to fix:

- **Do:** re-open only the files listed for it in §6, and confirm the lines still match.
- **Do not:** redo a whole-repo audit, re-derive the auth model, or re-verify library behaviour (passport-jwt, cors), unless the code in those files has changed since `2a81115`. Check with `git log 2a81115..HEAD -- <files>`.

### Standing rules

- **Git and production:** do not commit, push, merge, deploy, or change production environment variables unless the user explicitly asks.
- **Database:** do not drop columns or run destructive migrations without approval.
- **Secrets:** never print or record secret values. This includes keys, tokens, passwords, and the suspected credential in F-007.
- **Commit hook:** `lint-staged` runs `prettier --write` on `apps/api/src/**/*.ts` and `packages/**/*.ts` at commit time. Prettier can reformat whole files and produce broad diffs. Check the staged diff before any commit the user requests.
- **Uncertainty:** if the impact on an existing workflow is uncertain, **stop and ask the user.**

---

## 1. Project Context

**Project**
- **Name:** WITHUS.
- **Company:** MAKEWITHUS PRIVATE LIMITED.
- **Product:** a credential-management platform with controlled browser-extension autofill.
  - Organisation owners store third-party logins in an encrypted vault.
  - They grant team members time-limited **delegated sessions**.
  - The WITHUS Chrome extension autofills those credentials on supported sites. It can also fetch login OTPs from the organisation's connected Gmail.
- **Status:** a live, working product in active use.

**Monorepo**

| Path | Contents |
|---|---|
| `apps/api` | NestJS API, Prisma/Postgres |
| `apps/web` | Next.js dashboard. Proxies `/api/v1/*` to the API. |
| `apps/extension` | Chrome MV3 extension |
| `packages/db` | Prisma schema |
| `packages/security` | Argon2id hashing |
| `packages/config` | Shared config (`AUTH_CONFIG`) |

**Hosting**
- API: `https://sdap.onrender.com/api/v1` (the extension default in `apps/extension/src/lib/api.ts:5-8`).
- Web: the `NEXT_PUBLIC_API_URL` rewrite target in `apps/web/next.config.js:112-113`.

**Payments**
- HDFC Bank SmartGateway (Juspay) lives in `apps/api/src/billing/**` and is **under HDFC underwriting review**.

**Razorpay**
- The business describes Razorpay as a present integration.
- In this repo, Razorpay appears **only as an autofill/OTP target platform** (`apps/extension/src/providers/platform-registry.ts`, `apps/api/src/integrations/gmail/otp-patterns.ts`, `apps/web/components/sessions/CreateSessionModal.tsx`).
- As of 2026-11-10, no Razorpay payment-gateway code (orders, webhooks, signatures) was found in `apps/` or `packages/`.
- Treat anything Razorpay-related as protected regardless.

**Trigger**
- HDFC Underwriting asked how WITHUS protects the user login credentials it stores.
- Specifically: what technology secures the data, and is it stored on the server or only on the user's device, like cookies?

### 🔒 The most important engineering requirement

**PRESERVE ALL EXISTING WORKING FUNCTIONALITY.**

- Make only targeted security fixes.
- No architectural redesign.
- Leaving a finding temporarily unresolved and asking the user is better than breaking a working feature.

---

## 2. Verified Security Architecture (code-level)

These points come from **static source review** at HEAD `2a81115`. They are **verified at code level, not independently production-certified.**

| # | Property | Evidence |
|---|---|---|
| 1 | Credentials are stored **server-side** in Postgres, encrypted, and not on the user's device. | `apps/api/src/vaults/secret-lifecycle.service.ts:111-194`; `schema.prisma` models `Secret` (approx. 222-250) and `SecretVersion` (approx. 252-274) |
| 2 | **AES-256-GCM** via Node `crypto`. | `apps/api/src/vaults/encryption.service.ts:21` |
| 3 | Each credential gets a unique random **256-bit DEK** (`crypto.randomBytes(32)`). The DEK is reused across that credential's versions, with a fresh IV each time. | `encryption.service.ts:40-42`; `secret-lifecycle.service.ts:128, 276-281` |
| 4 | Each DEK is **wrapped with a separate MEK** and stored in `Secret.encryptedDek` as `base64(iv).base64(tag).base64(ct)`. | `encryption.service.ts:47-64`; `secret-lifecycle.service.ts:62-88, 129-130` |
| 5 | The MEK comes **only** from the `VAULT_ENCRYPTION_KEY` env var (base64, must decode to 32 bytes). There is **no fallback or default key**: the app throws at construction if the key is missing or invalid. There is no KMS or HSM. | `encryption.service.ts:23-35`; zod rule `min(32)` at `apps/api/src/config/env.validation.ts:7-9` |
| 6 | A **fresh random 96-bit IV** is generated on every encryption. | `encryption.service.ts:52, 94, 180` |
| 7 | **GCM authentication tags are verified** on decrypt (`setAuthTag` + `final()`), and tamper tests exist. | `encryption.service.ts:72-74, 131-134`; `encryption.service.spec.ts:139,158` |
| 8 | The payload **AAD** is `organizationId:vaultId:secretId:version`, used on both encrypt and decrypt. Tests show that changing any part makes decryption fail. The DEK wrap itself uses no AAD. | `encryption.service.ts:95-98, 129-132, 144-147`; `encryption.service.spec.ts:188-250` |
| 9 | WITHUS account passwords use **Argon2id**: m=64 MiB, t=3, p=1, with a random salt per hash (the library default). | `packages/security/src/hash.ts:1-15`; used at `apps/api/src/auth/auth.service.ts:51,217,486`, `users.service.ts:60-65` |
| 10 | Extension storage holds **only WITHUS auth tokens and tab/platform presence**, never passwords. `chrome.storage.session` holds only capability-restriction names. The extension source contains no `console.log`. | `apps/extension/src/lib/storage.ts`; `lib/types.ts:3-9`; `content/capability-enforcer.ts:60,134` |
| 11 | Credentials are **decrypted on the server** only after delegated-session checks (see §4). | `apps/api/src/sessions/sessions.service.ts:575-735` |
| 12 | Payments and credential management are **logically separated, not physically isolated**. `BillingModule` imports no vault, session, or encryption code. The HDFC payload carries only order, amount, customer ID/email/phone, and plan description. Billing's only contact with credential tables is `integrationConnection.count()` in `entitlement.service.ts:199`. Both run in the same process and database. | `apps/api/src/billing/billing.module.ts:27-53`; `billing.service.ts:307-326` |
| 13 | Gmail OAuth tokens (used for OTP) use the same DEK/MEK envelope pattern. Not audited in depth. | `apps/api/src/integrations/core/integration-encryption.service.ts` |
| 14 | MEK rotation is done **offline** by a script. At runtime only the single env MEK is used, and `KeyMetadata.version` does not select a key. | `apps/api/scripts/rotate-mek.ts`; `EncryptionService.rewrapDEK` (`encryption.service.ts:160-192`) |

**Not independently verified:**
- Production infrastructure security and the Render hosting configuration.
- The TLS versions and ciphers actually negotiated.
- Protection of production environment variables.
- Database access controls and backup security.

The API listens on plain HTTP behind the host's TLS termination (`main.ts:169-170`). There is no in-app HTTP→HTTPS redirect. HSTS is sent only when `NODE_ENV=production` (`main.ts:42-44`).

This is **not** a zero-knowledge architecture: the server holds the MEK and can decrypt.

---

## 3. Authentication & Request-Flow Reference

Already verified. Do not re-derive.

### Clients and how they authenticate

| Client | How it authenticates | CSRF | Cookies sent? | Notes |
|---|---|---|---|---|
| **Web dashboard** (`apps/web`) | `sdap_token` httpOnly cookie (access, 1 h). `sdap_refresh_token` httpOnly cookie (7 d, path `/api/v1/auth/refresh`). Set in `auth.controller.ts:47-69`, `SameSite=None; Secure` in prod. | Double-submit: the `sdap_csrf` cookie (non-httpOnly) is echoed in the `X-CSRF-Token` header (`apps/web/lib/api/client.ts:30,64,91`). | Yes. axios `baseURL: '/api/v1'` (`client.ts:82`) goes through the Next rewrite proxy, so cookies are **first-party on the web domain**. | The web app **never sends an `Authorization` header** (grep-verified). |
| **Browser extension** (`apps/extension`) | `Authorization: Bearer <accessToken>` plus `X-Extension-Client: withus-mv3` (`apps/extension/src/lib/api.ts:18-28`). Tokens come from `POST /auth/login` and are stored in `chrome.storage.local` (`withus_auth`). Refreshed every 50 min by alarm (`service-worker.ts:20-40`). | Bypassed via `isExtensionWithBearer` (`csrf.middleware.ts:33-35`). | **No.** `fetch` has no `credentials` option, so cross-origin requests from the service worker send no cookies. | Requests come from the MV3 service worker, whose host is in `host_permissions` (`manifest.json`). |
| **API keys** (programmatic) | `ApiKeyGuard` checks the SHA-256 of the key against `ApiKey.keyHash`. | GETs and safe methods only, or as configured | — | `apps/api/src/programmatic/programmatic.controller.ts`. Org-scoped correctly (lines 53-59, 77-85). |
| **HDFC return** | None. A **top-level browser navigation** (form POST or GET redirect) from the gateway to `POST/GET /api/v1/billing/return` (`billing.controller.ts:148-179`), which verifies the HMAC and then `res.redirect(...)`. | Exempt (`csrf.middleware.ts:47-49`). | — | May arrive with `Origin: null` (see the comment at `main.ts:78`). It does **not** need CORS response headers because it is a navigation. |
| **HDFC webhook** | Server-to-server, `HdfcWebhookGuard` (Basic Auth) on `POST /billing/webhook` (`billing.controller.ts:188-189`). | Exempt. | — | Does not need CORS. |

### JWT details
- RS256 (`jwt.strategy.ts:36-50`).
- The extractor order is **cookie `sdap_token` first, then Bearer**. passport-jwt `fromExtractors` returns the first non-null token (verified in `node_modules/passport-jwt/lib/extract_jwt.js:75-89`).
- `validate()` does **no DB lookup** (`jwt.strategy.ts:53-59`), so a removed user's JWT stays valid until it expires (1 h, `packages/config/src/index.ts:5`).

### `cors` library behaviour
Verified in `node_modules/cors/lib/index.js:218-226` and `:94-103`.
- The origin callback `cb(err)` calls `next(err)`, so the request **fails through the Nest error path**.
- `cb(null, false)` calls `next()` **with no CORS headers**, so the request is still processed. A browser `fetch` cannot read the response, but navigations and server-to-server calls work normally.
- `cb(null, true)` reflects the request origin, including the literal `"null"`.
- With no `allowedHeaders` configured, the requested headers are reflected.

### Guards
- `JwtAuthGuard` handles authentication.
- `PermissionsGuard` (`authorization/guards/permissions.guard.ts`) returns `true` when a handler has **no `@RequirePermissions`**.
- When a handler does have permissions, the guard resolves the org from the route param (`@OrganizationContext('orgId')`) and checks membership with `removedAt === null` (`resolvers/membership.resolver.ts:9-18`).
- Global `ThrottlerGuard` (`app.module.ts:80-81`) plus `express-rate-limit` (`main.ts:99-144`).

---

## 4. Credential Lifecycle & Endpoint Map

### Endpoints that touch credentials
All are under `/api/v1`.

| Endpoint | Guards / checks | Returns plaintext? |
|---|---|---|
| `POST /organizations/:orgId/vaults/:vaultId/secrets` | JWT + `SECRET_CREATE`. ⚠️ No check that `vaultId` belongs to `orgId`. | No |
| `GET  .../vaults/:vaultId/secrets` | JWT + `SECRET_READ`. ⚠️ Not org-scoped (F-004). | No (metadata) |
| `GET  .../vaults/:vaultId/secrets/:secretId` | JWT + `SECRET_READ`. ⚠️ Not org-scoped (F-004). | No (metadata) |
| `POST .../vaults/:vaultId/secrets/:secretId/reveal` | JWT + `SECRET_REVEAL`, entitlement checks; the service checks `secret.vault.organizationId === orgId`. | **Yes** `{ plaintext }` |
| `PATCH` / `DELETE .../secrets/:secretId` | JWT + `SECRET_UPDATE` / `SECRET_DELETE`; the service checks org. | No |
| `POST /organizations/:orgId/sessions/:sessionId/reveal` | JWT only (**no `@RequirePermissions`**); session checks plus `permission === REVEAL`; throttled 10/min. | **Yes** `{ plaintext }` |
| `POST /organizations/:orgId/sessions/:sessionId/launch` | JWT only (**no `@RequirePermissions`**); session checks (any permission); throttled 20/min. Used by the extension. | **Yes** `{ plaintext }` |
| `POST /organizations/:orgId/sessions/:sessionId/otp` | JWT only; inline grantee, status, and expiry checks; throttled 10/min. | OTP code only |
| `GET /api/v1/programmatic/secrets/:id`, `POST .../reveal` | `ApiKeyGuard`, org-checked. | Reveal: yes |

**Session checks** (`session-validation.service.ts:19-46`) cover four conditions:
- the caller is the grantee;
- `status === ACTIVE`;
- `now <= expiresAt`;
- `revealCount < maxReveals`.

They run **twice**: before the transaction, then again inside it. The counter is incremented with an optimistic lock (`updateMany where revealCount = old`). The session is set to `EXPIRED` once uses run out (`sessions.service.ts:575-735`). The session is also checked against the URL org (`session.organizationId === orgId`).

**Not checked anywhere in the session path:**
- current org membership (F-003);
- `Secret.status`: DISABLED and PENDING_ROTATION credentials still decrypt.

### Lifecycle

1. **Create**
   - Pre-generate `secretId`.
   - `DEK = randomBytes(32)`.
   - `wrap = GCM(MEK, rand12)(DEK)`.
   - `ct = GCM(DEK, rand12, AAD="org:vault:secret:1")(plaintext)`.
   - `fingerprint = SHA-256(plaintext)` ⚠️ (F-002).
   - All of this is written in one transaction (`secret-lifecycle.service.ts:111-194`).
2. **Update.** Unwrap the DEK, then append a new `SecretVersion` with the next version number in its AAD (`:247-361`).
3. **Reveal.**
   - Load the secret with its latest version, check the org, unwrap the DEK, then decrypt with the rebuilt AAD (`:376-512`).
   - Update `revealCount` / `lastRevealedAt`, then emit `secret.reveal.succeeded`.
   - On failure, throw a generic `InternalServerErrorException('Unable to reveal secret')`.
4. **Transmission.** JSON `{ plaintext }` over HTTPS to the extension service worker.
5. **Extension.**
   - In `service-worker.ts:238-286`, `LAUNCH_SESSION` splits the plaintext into username and password. Supported formats: `user\npass`, `user:pass`, `user pass`, or the whole value as the password.
   - The pair is returned to the content script through `chrome.runtime` messaging.
   - Nothing is persisted.
6. **Autofill.**
   - `content/autofill.ts:333-439` fills the DOM inputs.
   - A CSS mask plus a type-lock MutationObserver hides "show password" toggles (`:69-125`).
   - The multi-step password watcher keeps the password in a closure for up to 30 s (`:576-600`).
   - On install, the extension disables Chrome's password saving (`service-worker.ts:76-81`, best effort).
7. **Cleanup.** `response.data = null` (`autofill.ts:438, 910`). This does **not** erase memory: JS strings are immutable, and the page's `<input>.value` stays readable by page scripts and DevTools.
8. **Delete.** Soft delete only. Ciphertext is retained (`secret-lifecycle.service.ts:514-568`).

### Audit events persisted to `AuditEvent`
Defined in `audit/audit-listener.service.ts`. Audit writes are best-effort: errors are swallowed.

- `secret.created`, `secret.updated`, `secret.deleted`
- `secret.revealed` (success only, for both `/reveal` and `/launch`)
- `session.created`, `session.revoked`, `session.expired`
- `approval.requested`, `approval.approved`, `approval.rejected`
- `integration.connected`, `integration.disconnected`
- generic `audit.log` events, such as `otp.fetched`, `member.offboarded`, `session.revoke_all`, `session.revoke_failed`

The **web dashboard already has a label for `secret.reveal_denied`**, but nothing on the backend currently writes it. Use that existing name for F-006.

---

## 5. 🔒 ABSOLUTE PRESERVATION REQUIREMENTS

**The following must remain untouched unless the user explicitly approves a change.**

### Payment integrations — DO NOT MODIFY
- **HDFC SmartGateway integration:** `apps/api/src/billing/hdfc/**`
- **HDFC payment service:** `hdfc-gateway.service.ts`
- **HDFC webhook processing:** `hdfc-webhook.guard.ts` and the `POST /billing/webhook` route
- **HDFC HMAC/signature verification:** `hdfc-signature.service.ts`
- **HDFC order verification and status**
- **HDFC mandate operations:** execution, status, and revocation
- **Razorpay integration and Razorpay webhooks**, if or when present
- **Subscription billing:** `apps/api/src/billing/subscription/**`, `billing.service.ts`
- **Renewal and reconciliation schedulers:** `billing.renewal.scheduler.ts`, `billing.reconciliation.scheduler.ts`
- **Payment controllers, DTOs, and models:** `billing.controller.ts`, `billing/dto/**`, and the Prisma models `Subscription` and `Payment`
- **Payment-related environment variables:** `HDFC_*`, `BILLING_*`
- **Payment-related frontend workflows**

> **If a security fix requires changing payment-related files or behaviour, STOP AND ASK THE USER.** This includes indirect changes through shared middleware (CORS, CSRF), auth guards, or shared services.
>
> Known shared touchpoints:
> - the CORS allow-list in `apps/api/src/main.ts:63-94` (the HDFC substrings and `null`);
> - the CSRF exemptions for `/billing/return` and `/billing/webhook` in `csrf.middleware.ts:44-49`.

### Other protected functionality
- **Application architecture:** keep the existing structure.
- **Browser extension:** its architecture, `manifest.json`, permissions, and autofill workflow.
- **Authentication and authorization workflows:** cookie auth for the web, Bearer auth for the extension.
- **API contracts:** endpoint names and request/response formats.
- **Credential encryption:** encryption and decryption, the DEK/MEK architecture, and key rotation.
- **Organization and membership workflows:** the remove vs. offboard semantics.

All changes must be **narrowly scoped and backward compatible.**

---

## 6. Security Audit Findings — Evidence & Fix Design

Line numbers are as of `2a81115`. **The "Proposed fix" entries are recommendations only. None have been approved or applied.**

### F-001 — CORS and CSRF Security
- **Severity:** Critical (browser exploitability not yet demonstrated)
- **Status:** Strongly suspected. Pending.

**Evidence**
- `apps/api/src/main.ts:63-94`. The origin callback allows all of the following, with `credentials: true` (line 93):
  - no origin;
  - `'null'` (line 78);
  - any `chrome-extension://` origin;
  - exact `CORS_ORIGIN` entries (default `http://localhost:3000`);
  - **substring** matches on `smartgateway`, `juspay`, `hdfcbank`, and `loca.lt` (lines 82-85).
- Disallowed origins call `callback(new Error('Not allowed by CORS'))` (line 89).
- `csrf.middleware.ts:33-35, 51-58`: CSRF is skipped when `X-Extension-Client: withus-mv3` is present together with **any** `Authorization` header. The token's validity is not checked at this point.
- The JWT extractor reads the cookie first (§3). Prod cookies are `SameSite=None`.

**Suspected attack chain**
1. A logged-in user visits a malicious page. The page uses either a sandboxed iframe (which sends `Origin: null`) or a lookalike domain such as `*.loca.lt` or one containing `hdfcbank`.
2. The page sends `fetch(..., {credentials:'include'})` with the headers `Authorization: Bearer x` and `X-Extension-Client: withus-mv3`.
3. The cookie authenticates the request, CSRF is skipped, and CORS lets the page read the response.
4. The page then calls:
   - `GET /users/me` to get the org;
   - `GET /organizations/:org/sessions/incoming` to get session IDs;
   - `POST .../sessions/:id/launch` to get **plaintext**;
   - for owners, `POST .../secrets/:id/reveal`.

**Open question:** do the target browsers send the `SameSite=None` cookie in that context? Chrome generally does; Safari and Firefox often don't. Also, because web cookies live on the web domain via the proxy, the attacker would target the web domain's `/api/v1/*`. The proxy passes `Origin` through and returns the API's CORS headers.

**⚠️ Pitfall:** simply rejecting `null` while keeping `callback(new Error)` would make HDFC's return navigation fail with an error response. **This breaks payment returns.**

**Proposed fix** (needs user approval because it is shared HDFC middleware). Make two minimal changes:
1. **CORS (`main.ts`):**
   - For disallowed origins, call `callback(null, false)` instead of `callback(new Error(...))`. Requests are still processed, just without CORS headers.
   - Remove `'null'` and the **substring** rules (`smartgateway`, `juspay`, `hdfcbank`, `loca.lt`) from the credentialed allow-list. HDFC return and webhook don't need CORS headers (§3).
   - Keep `!origin`, the exact `CORS_ORIGIN` entries, and `chrome-extension://` (kept for compatibility; the extension's host permissions largely bypass CORS anyway).
   - Remove the `[CORS DEBUG] console.log` (lines 72-75), optionally.
2. **CSRF (`csrf.middleware.ts`):**
   - Apply the extension bypass only when the request is **not** cookie-authenticated, for example `isExtensionWithBearer && !req.cookies?.['sdap_token']`, and require that `Authorization` starts with `Bearer `.
   - This is safe because the extension sends no cookies and the web app sends no `Authorization` header (§3).
   - **Do not change the JWT extractor order.** That would be a broader auth change.

**Tests for F-001**
- No CSRF or CORS spec exists. Add a small unit spec for `csrfMiddleware` covering:
  - cookie + dummy Bearer + extension header → 403;
  - Bearer only + extension header → pass;
  - `/billing/return` → pass.
- Manual checks:
  - web login plus one state-changing action, such as creating a vault;
  - extension login, `/launch` autofill, `/otp`, and heartbeat;
  - `curl -X POST -H 'Origin: null' .../api/v1/billing/return` must reach the controller (redirect or HMAC error), **not** a CORS error.

**Files:** `apps/api/src/main.ts`, `apps/api/src/common/middleware/csrf.middleware.ts`. Read-only context: `auth/jwt.strategy.ts`, `auth/auth.controller.ts`, `apps/web/next.config.js`, `apps/web/lib/api/client.ts`, `apps/extension/src/lib/api.ts`.

### F-002 — Plaintext-Derived Credential Fingerprint
- **Severity:** High
- **Status:** Confirmed code behaviour. Pending.

**Evidence**
- `encryption.service.ts:110, 152-154`: `encryptPayload` returns `fingerprint = SHA-256(plaintext)`, unsalted.
- `secret-lifecycle.service.ts:166, 309` persist it to `SecretVersion.fingerprint`.
- The schema declares it as **`String` (non-nullable)** with the comment `// SHA-256 of plaintext`.
- Repo-wide grep: **no reads of the column anywhere.**
  - Files mentioning `fingerprint`: `encryption.service.ts`, `secret-lifecycle.service.ts`, both of their specs, `apps/api/scripts/rotate-mek.ts`, and `apps/web/app/security/page.tsx` (marketing text only).

**Do not confuse with the DEK fingerprint**
- `computeFingerprint(dek)` in `encryptDEK` / `rewrapDEK` (`encryption.service.ts:62, 190`) and `rotate-mek.ts:55` hashes the **random DEK**, not user data.
- It is used only by key rotation. Leave it untouched.

**Risk**
- Anyone with a DB copy can test credential guesses offline without the MEK.
- Identical credentials can be linked across tenants.

**Proposed fix** (backward-compatible, no schema change)
- In `encryptPayload`, stop hashing the plaintext.
  - Option A: return `fingerprint: ''`.
  - Option B: keep the `EncryptionResult` type and let `secret-lifecycle` write `''`.
- Because the column is non-nullable, an empty string keeps inserts valid.
- Existing rows keep their old hashes. Clearing them (`UPDATE "SecretVersion" SET fingerprint=''`) is a data change, and making the column nullable or dropping it is a schema change. **Both need user approval.**

**Tests:** update the `encryption.service.spec.ts:111` test (*"should generate a valid fingerprint for the plaintext"*) and any fingerprint assertion in `secret-lifecycle.service.spec.ts`. Run both specs.

### F-003 — Organization Membership Validation
- **Severity:** High
- **Status:** Confirmed code path. Pending.

**Evidence**
- `/reveal`, `/launch`, and `/otp` in `sessions.controller.ts:124-306` have no `@RequirePermissions`, so the membership resolver never runs (§3).
- `validateSessionForUse` does not check membership.

**Remove vs. offboard**
- **Remove** (`organizations.service.ts:314-329`, `DELETE /organizations/:id/members/:memberId`, `organizations.controller.ts:166-173`) only sets `removedAt`. Delegated sessions stay ACTIVE.
- **Offboard** (`organizations.service.ts:346+`, `POST .../offboard`, `controller:179-186`) revokes delegated sessions, revokes refresh tokens, and cancels pending approvals.
- The web app exposes both actions (`apps/web/app/settings/members/page.tsx:97-98, 197, 211`).

**Impact:** a removed (not offboarded) member can keep using `/launch` and `/otp` until their sessions expire.

**Proposed fix** (minimal; does not change the remove or offboard semantics)
- In `SessionsService.revealSecretViaSession` and `launchSessionForExtension`, after loading the session, require an active membership. For example:

  ```ts
  prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: granteeId } },
  })
  ```

  Reject with `ForbiddenException` if the record is missing or `removedAt !== null`. The compound unique `organizationId_userId` already exists; `sessions.controller.ts:325-329` uses it.
- Add the same check to the `/otp` handler.
- **Do not** change `removeMember` to revoke sessions without asking the user. That would change the semantics of the existing workflow.
- The 1 h JWT window after removal remains a separate known limitation.

**Tests**
- `sessions.controller.otp.spec.ts` mocks prisma with only `delegatedSession.findUnique` (line 45). It will need an `organizationMember.findUnique` mock if `/otp` gains the check.
- Add or extend a sessions-service spec covering:
  - an active member → allowed;
  - `removedAt` set → 403.
- Re-run `organizations.service.spec.ts` and `organizations.controller.spec.ts`.

### F-004 — Cross-Tenant Data Access
- **Severity:** High (impact is metadata only)
- **Status:** Confirmed query pattern. Pending.

**Vulnerable endpoints**
- `apps/api/src/vaults/controllers/secrets.controller.ts:67-79`: `GET .../vaults/:vaultId/secrets` calls `getSecretsByVaultId(vaultId)`, and `GET .../secrets/:secretId` calls `getSecretMetadataById(secretId)` (`secret-lifecycle.service.ts:196-245`). Neither checks that the vault or secret belongs to `:orgId`. `PermissionsGuard` only proves membership of `:orgId`.
- **Also found:** `POST .../vaults/:vaultId/secrets` (`secrets.controller.ts:47-65`, `createSecret` at `secret-lifecycle.service.ts:111+`) does not verify that `vaultId` belongs to `orgId`. That allows a cross-tenant **write** of a junk secret into another org's vault. The secret wouldn't decrypt for the other org, because the AAD carries the creator's org, but it would show up in their list.

**Already correctly scoped** (no change needed)
- **Vault endpoints:** `vaults.service.ts:55-135` filters by `organizationId`; `updateVault` and `deleteVault` call `getVaultById(orgId, …)` first.
- **Secret reveal, update, and delete:** check `secret.vault.organizationId`.
- **Programmatic controller:** org-checked.

**Exposure:** metadata only (name, description, type, status, reveal counts, creator IDs). No plaintext. An attacker must know a UUIDv4 from another org.

**Proposed fix**
- In `secrets.controller.ts` (`createSecret`, `getSecrets`, `getSecretById`), first verify that the vault belongs to the org:

  ```ts
  prisma.vault.findFirst({ where: { id: vaultId, organizationId: orgId, deletedAt: null } })
  ```

  Throw `NotFoundException` if it doesn't. For detail requests, also check `secret.vaultId === vaultId`.
- `PrismaService` is already injected in that controller.
- Keep response shapes unchanged. The detail response already includes `vault: { organizationId, platformId }`; leave it as is.

**Tests:** `apps/api/test/vaults.e2e-spec.ts` (e2e needs a DB, so run it only if one is available). Otherwise add a focused controller unit test.

### F-005 — Unsupported Public Security Claims
- **Severity:** Medium
- **Status:** Confirmed. Pending.
- **Evidence:** `apps/web/app/security/page.tsx`:
  - **approx. line 38:** "TLS 1.3". Unverifiable; TLS is managed by the host.
  - **approx. lines 78-81:** "Immutable", "immutable, tamper-evident audit records", "every authentication attempt", and "IP fingerprint". The code does none of this:
    - audit rows are deletable and cascade on organisation delete;
    - IP is not captured;
    - failed attempts are not logged;
    - authentication attempts are not written to `AuditEvent`.
- **Proposed fix:** change the wording only, for example "HTTPS (TLS)" and "audit records of credential access, session, and administrative events with actor and timestamp". Keep the layout, styling, and metadata. Re-scan the rest of the page for other unsupported claims, such as certifications or zero-knowledge.
- **Test:** `next build` or a typecheck of `apps/web`, plus a visual check.

### F-006 — Audit Logging Gaps
- **Severity:** Medium
- **Status:** Confirmed. Pending.

**Evidence**
- `secret-lifecycle.service.ts:403-436` emits `SecretRevealRequestedEvent` with IP and UA hard-coded to `'unknown'`; the fields are defined in `vaults.events.ts:60-70`. The service has no access to the request.
- No listener exists for `secret.reveal.requested` or `secret.reveal.failed`.
- Session-validation denials (wrong grantee, expired, max uses) are not audited.
- Audit write errors are swallowed (`audit-listener.service.ts:31-34`).
- `AuditEvent` cascades on organisation delete.
- The reveal reason is written only to app logs.

**Proposed fix** (small and backward-compatible)
1. Add an `@OnEvent('secret.reveal.failed')` listener that persists the action **`secret.reveal_denied`**, the name the web dashboard already labels. Store `{ vaultId, reason: <generic message> }`. The messages are generic, such as `'Secret unavailable'` or `'Decryption failed'`; never include payloads.
2. Optionally, in the session reveal/launch paths, emit `audit.log` with `secret.reveal_denied` when session validation throws.
3. **IP/UA capture** means passing request data from controllers into services, which changes method signatures. **Ask the user first.** Otherwise leave it as a documented limitation and keep public claims accurate (F-005).

**Rule:** never log plaintext, keys, tokens, or credential payloads.

**Tests:** extend `audit-listener.service.spec.ts`.

### F-007 — Potential Credential in Source Comment
- **Severity:** Medium (unverified)
- **Status:** Present. Authenticity unknown. Pending.
- **Evidence:** `apps/extension/src/background/service-worker.ts`, in the `LAUNCH_SESSION` comment block (approx. line 269, the `E.g. "..."` example for space-separated parsing). It contains an example email and password that look personal.
- **Do not reproduce the value anywhere:** not in terminal output, docs, reports, or commits.
- **Proposed fix:**
  1. Ask the user whether the credential is real. If it is, recommend rotating it immediately.
  2. Replace only the example values with obvious placeholders, such as `user@example.com` / `examplePassword`. Change nothing else in the service worker.
  3. The value remains in git history. Rewriting history is a separate, user-approved action.
- **Test:** `apps/extension` build (`node build.mjs`). A comment-only change has no runtime effect.

### Lower-severity items (not in the roadmap; recorded so nobody re-audits them)

| Item | Detail | Constraint |
|---|---|---|
| Reveal ignores `Secret.status` | DISABLED and PENDING_ROTATION credentials still decrypt (`secret-lifecycle.service.ts:397-401`). | Possible behaviour change; ask first. |
| Soft-deleted credentials | Ciphertext is retained indefinitely (`:536-550`). | — |
| "EXTENSION-only" sessions | Not enforced against the grantee: `/launch` returns plaintext to any holder of the grantee's JWT, and autofill puts it in the page DOM. | Design limitation. Never claim "password never exposed to the grantee". |
| MEK storage | MEK is in an env var with no KMS/HSM. | — |
| GCM tag length | `authTagLength` is not pinned on decrypt (`encryption.service.ts:71, 130`). | — |
| Extension token storage | Tokens are stored unencrypted in `chrome.storage.local`. | Standard for MV3. |
| Manifest | The production manifest still has `http://localhost` / `127.0.0.1` host permissions and content-script matches. | Manifest is protected; ask first. |
| `aadHash` column | `SecretVersion.aadHash` is never populated. | — |
| Stale `.js` files | Committed compiled files next to the `.ts` sources (`apps/api/src/vaults/encryption.service.js`, `apps/api/src/sessions/sessions.service.js`). Runtime uses `dist/` (`apps/api/package.json:9-10`). | — |

---

## 7. HDFC Underwriting Response

**Status:** draft prepared; not sent.

**Before sending:**
- Resolve **F-001** and **F-002**.
- Correct **F-005**, since HDFC may read the public page.

*Status as of 2026-11-10:*
- **F-005 is done.**
- **F-002 is done for new writes only.** The first [†] sentence ("a copy of the database alone contains only encrypted credential data") becomes fully true only after the approved one-off clear of existing `SecretVersion.fingerprint` values.
- **F-001 is still open,** so the second [†] sentence still depends on it.
- F-003 is also strongly recommended.
- If the email must go out earlier, **delete the two sentences marked [†]**.

**Claims that must stay out of any HDFC communication** until they are verified or fixed:
- a specific TLS version;
- immutable or tamper-evident audit logs;
- IP or device capture;
- logging of failed attempts;
- "password never visible to the team member";
- secure memory wiping;
- KMS or HSM;
- any certification (SOC 2, ISO 27001, PCI-DSS, FIPS);
- zero-knowledge;
- full infrastructure isolation of payments.

**Update the draft below** as fixes land. For example, once F-006 ships, failed-attempt logging can be mentioned.

<details>
<summary>Draft email (click to expand)</summary>

**Subject:** WITHUS — Clarification on storage and protection of user login credentials

Dear HDFC Bank Underwriting Team,

Thank you for your question about how WITHUS stores and protects the login credentials our customers save on the platform. Below is a factual description of the current implementation.

**1. Where credentials are stored**

Credentials are stored on WITHUS servers, in our application database, in encrypted form. They are not stored on the end user's device in the way browser cookies are. We store them server-side because the product lets a business owner grant a team member time-limited access to a login without sharing the password directly. That requires a central, access-controlled store.

**2. Encryption technology**

- Every saved credential is encrypted with AES-256-GCM, an authenticated encryption algorithm.
- Each credential has its own randomly generated 256-bit data key.
- A fresh random initialisation vector is used every time data is encrypted.
- GCM's authentication tag is verified on every decryption, so altered data is rejected rather than returned.
- Each encrypted credential is cryptographically bound to its own organisation, vault, credential ID, and version number. An encrypted value copied to another record or another customer's account will fail to decrypt.

**3. Separation of encryption keys from the database**

We use envelope encryption. Each credential's data key is itself encrypted with a separate 256-bit master key, and only that encrypted form is saved in the database.

The master key is not stored in the database. It is supplied to the application server through its secured environment configuration, and the application refuses to start if the key is absent or malformed. [†] As a result, a copy of the database alone contains only encrypted credential data and cannot be decrypted without the master key.

The server can decrypt credentials when an authorised request requires it. This is therefore not a "zero-knowledge" system, and we don't describe it as one.

**4. What is stored in the browser extension**

The WITHUS browser extension does not save customer passwords to browser storage, cookies, local storage, or disk. It stores only the team member's own WITHUS sign-in tokens and basic tab-state information.

During an autofill, the decrypted credential is held briefly in memory and entered into the target website's login form. It is not written to extension storage. On installation, the extension also attempts to switch off the browser's built-in password saving, to discourage the browser from keeping a copy.

**5. Who can retrieve a credential, and how**

Credentials are decrypted only on the WITHUS server, and only in response to an authenticated request:

- An organisation owner or administrator explicitly grants a named team member access to one credential through a "delegated session". The session has an expiry time and, optionally, a maximum number of uses. Organisations can also require approval before access is granted.
- When the team member signs in to the target website, the extension sends a request to the WITHUS API using that member's signed (RS256) login token.
- Before decrypting anything, the server checks that:
  - the requester is the designated recipient;
  - the session is active and has not expired or been revoked;
  - the usage limit has not been reached.
- If any check fails, the request is rejected.
- [†] The decrypted credential is then returned to the extension over an HTTPS connection and filled into the login form.

Access can be revoked at any time, and credential-retrieval endpoints are rate-limited.

**6. Account passwords for WITHUS itself**

Passwords that users set for their own WITHUS accounts are stored separately from customer credentials. They are not encrypted reversibly. They are hashed with Argon2id (64 MB memory cost, 3 iterations), using a unique random salt per password.

**7. Transport security**

The WITHUS browser extension and web application communicate with our API over HTTPS. In production, the API sends an HTTP Strict-Transport-Security header instructing browsers to use HTTPS only, and authentication cookies are marked Secure and HttpOnly. TLS is terminated by our hosting provider's infrastructure; the protocol versions offered are governed by that provider's configuration.

**8. Activity logging**

The platform records an audit entry, with the acting user and a timestamp, for:

- credential creation, update, and deletion;
- each successful credential retrieval, including extension autofill;
- creation, revocation, and expiry of delegated sessions;
- approval decisions.

Organisation administrators can review and export these records from the dashboard.

**9. Separation from HDFC payment processing**

Payment processing through HDFC SmartGateway is implemented in a separate module of our application. It has no dependency on the credential vault, the session module, or the encryption service.

Payment requests to HDFC contain only the order ID, amount, customer ID, account email and phone number, and the subscription plan description. Customer credentials are never included in payment requests, payment metadata, or webhook processing.

The separation is logical, within the same application and database; payments do not run on separate infrastructure.

**10. Ongoing improvements**

We are continuing to strengthen these controls. Current work includes tightening cross-origin request policy, extending audit logs to record failed access attempts and network details, and evaluating a managed key-management service for the master key.

We would be happy to walk your team through the implementation or answer any follow-up questions.

Regards,
[Name]
[Title], WITHUS Engineering
[Contact]

</details>

---

## 8. Testing & Tooling Reference

**API (`apps/api`)**
- Runner: Jest 30 with ts-jest.
- Focused run: `cd apps/api && npx jest <path-or-pattern>`.
- E2E: `npm run test:e2e` (`test/jest-e2e.json`). E2E **needs a database**; don't run it unless one is configured.
- Typecheck: `cd apps/api && npx tsc --noEmit -p tsconfig.json`.

**Web (`apps/web`)**
- `next build`. Heavier; run it only for F-005.

**Extension (`apps/extension`)**
- `node build.mjs`. The `npm run build` script also zips the output.

**Relevant existing specs**

| Area | Specs |
|---|---|
| Encryption | `apps/api/src/vaults/encryption.service.spec.ts`, `secret-lifecycle.service.spec.ts` |
| Sessions | `apps/api/src/sessions/controllers/sessions.controller.otp.spec.ts` |
| Organizations | `apps/api/src/organizations/organizations.service.spec.ts`, `organizations.controller.spec.ts` |
| Auth | `apps/api/src/auth/auth.service.spec.ts`, `auth.controller.spec.ts` |
| Audit | `apps/api/src/audit/audit-listener.service.spec.ts` |
| Billing (do not modify) | `apps/api/src/billing/*.spec.ts` |
| E2E | `apps/api/test/vaults.e2e-spec.ts`, `apps/api/test/app.e2e-spec.ts` |

**⚠️ Jest resolves the stale `.js` files first**
- `apps/api/package.json` lists `moduleFileExtensions: ["js","json","ts"]`, so specs load the stale committed `src/**/*.js` files, such as `vaults/secret-lifecycle.service.js` and `vaults/encryption.service.js`, instead of the `.ts` source.
- Under the default config, **10 `secret-lifecycle.service.spec.ts` tests already failed before any change in this remediation.**
- To test the real source (what production builds from), run: `npx jest <path> --moduleFileExtensions ts js json`.
- Deleting the stale `.js` files or changing the Jest config would fix this permanently. That is a cleanup outside this remediation's scope; ask the user first.

**Gaps**
- No specs exist for `csrf.middleware.ts`, the CORS config, or `SessionsService` reveal/launch.

**Billing specs**
- **Do not modify** them to accommodate security changes.
- Running them read-only after a shared-middleware change (F-001) is a good regression check.

---

## 9. Remediation Roadmap

Priority order. All items are **pending**; none have been started.

- [x] **F-001:** Investigate and remediate CORS/CSRF. *Done 2026-11-10 with user approval, uncommitted.*
  - CORS is exact-match only. `null` and the substring rules are removed, and disallowed origins get `callback(null, false)`.
  - The CSRF extension bypass now requires `Bearer `, and the `sdap_token` cookie is removed from those requests so they authenticate with the token.
  - **Still to do by the user before deploy:** manual smoke tests (web login plus one action; extension login, autofill and OTP; one HDFC UAT payment return).
  - `chrome-extension://*` is still allowed: there is no pinned extension ID (no manifest `"key"`, no env var), and pinning one needs a new production env var.
- [x] **F-002:** Stop persisting plaintext-derived fingerprints, without a destructive migration. *Done 2026-11-10. New and updated versions store `''`. Existing rows still hold old hashes: clearing them is a data update that needs user approval (`UPDATE "SecretVersion" SET fingerprint=''`).*
- [x] **F-003:** Validate active organization membership during credential access (`/reveal`, `/launch`, `/otp`). *Done 2026-11-10. The remove vs. offboard semantics are unchanged. Still open: the 1 h JWT window after removal, and `removeMember` not revoking sessions; the latter is no longer exploitable for credential access.*
- [x] **F-004:** Enforce tenant-scoped secret access (list, detail, create). *Done 2026-11-10.*
- [x] **F-005:** Correct unsupported public security claims. *Done 2026-11-10. The PITR backup claim in section 5 of the page was left unchanged: it is a hosting setting that cannot be verified from code. **The user needs to confirm it against the Render database plan.***
- [ ] **F-006:** Improve audit accuracy without logging sensitive values.
- [x] **F-007:** Investigate the potentially exposed source-code credential. *Done 2026-11-10.*
  - The user **confirmed the credential is real.**
  - The example in the comment was replaced with `user@example.com examplePassword`. This is a one-line, comment-only change in `apps/extension/src/background/service-worker.ts`, with no runtime effect.
  - The built `apps/extension/dist` never contained it, because comments are stripped at build time.
  - **Git history is NOT rewritten (user's decision).** The old value remains in pushed history on `origin/main` and 4 other branches. The owner must change the Gmail password; that is the effective mitigation.
  - *Investigation 2026-11-10, no code change:*
    - The value is a real-format Gmail address plus a password-like string.
    - It was added in commit `ce36eaf` (2026-08-07, by the repo developer) and appears in no other tracked file.
    - The email local part and the password both resemble a personal name, which suggests it is **likely genuine**.
  - **Recommendation:** the owner should change that Gmail password now. Then, with approval, replace the example with placeholders. Removing it from git history is a separate decision.
  - Value deliberately not recorded.
- *F-006 (investigation only this phase):* nothing new beyond §6. Implementation plan unchanged and awaiting approval.

For each item, record the files changed, the tests run, the result, and the date in §11.

---

## 10. Stop Conditions

Stop and ask the user before proceeding if:

- **Payments:** a fix requires changing HDFC or Razorpay logic, payment models, or payment env vars. This includes shared middleware the HDFC return/webhook depends on.
- **Database:** a fix requires a destructive migration, dropping a column, or a bulk data update.
- **Architecture:** a fix requires changing the application architecture.
- **Extension:** a fix requires changing the extension's authentication or autofill architecture, or its manifest.
- **Sessions:** a fix could unexpectedly invalidate legitimate user sessions.
- **Membership semantics:** a fix requires changing the remove vs. offboard behaviour.
- **Environment:** a fix requires changing production environment variables.
- **Dependencies:** a fix requires a new dependency or external service.
- **Uncertainty:** you cannot confidently determine the impact of a proposed change.

---

## 10a. Backward Compatibility of Existing Data & Users (after F-001 to F-005, F-007)

The fixes require **no migration, no data change, and no re-login.**

| Existing thing | After the fixes | Why |
|---|---|---|
| Existing vaults and credentials | ✅ Work as before: reveal, autofill, update, delete | Encryption, DEK/MEK, IV and AAD are unchanged. Decryption never used `fingerprint`. Old rows keep their old fingerprint value; new versions store `''`. |
| Key rotation (`rotate-mek.ts`) | ✅ Unchanged | It uses the DEK fingerprint, which was not touched. |
| Existing delegated sessions of **active** members | ✅ Work as before: `/launch`, `/reveal`, `/otp`, expiry, max uses | The only new condition is "the grantee is still an active org member". Grantees can only be chosen from members. |
| Existing sessions of members who were **removed** (not offboarded) | ⛔ Now refused (403, or `{ error }` on `/otp`) | **Intended (F-003).** The sessions still show as ACTIVE in lists until expiry or revocation. |
| Logged-in web users | ✅ Stay logged in | Cookie, CSRF and JWT handling for the web app are unchanged. |
| Logged-in extension users | ✅ Stay logged in, autofill unchanged | The extension already sends `Bearer` tokens; its stored tokens are untouched. |
| Secret list and detail in the web app | ✅ Same responses | The web app always uses the secret's own org and vault. Only cross-org or wrong-vault URLs now get a 404. |
| API keys (programmatic access) | ✅ Unchanged | Not touched. |
| HDFC payment return and webhook | ✅ Reach the same controller and guard | Verified with the real `main.ts` configuration and the real `BillingController`/`HdfcWebhookGuard` (§11). **A UAT payment test is still recommended before deploy.** |
| Local dev through localtunnel (`*.loca.lt`) | ⚠️ Needs the exact tunnel URL in local `CORS_ORIGIN` | The substring rule was removed (F-001). Production is unaffected. |

**Before deploying,** confirm that production `CORS_ORIGIN` lists the exact web origin(s). It already had to for the web app to work, because exact matching was already used for it.

---

## 11. Change Log

| Date | Session / Author | Change | Files | Tests run | Result |
|---|---|---|---|---|---|
| 2026-11-10 | Claude Code (read-only audit) | Full security audit. No code changes. | — | None | Findings F-001 to F-007 recorded |
| 2026-11-10 | Claude Code (documentation) | Created this handover document. | `WITHUS_SECURITY_REMEDIATION_STATUS.md` | None | Created |
| 2026-11-10 | Claude Code (documentation) | Made the document self-sufficient: added the auth/request-flow reference (§3), the endpoint map, lifecycle and audit events (§4), the per-finding fix design and pitfalls (§6), the HDFC draft email (§7), and the testing reference (§8). New facts verified this session: the `cors` error-vs-false behaviour, that the web never sends `Authorization`, that extension `fetch` sends no cookies, that `createSecret` is not vault-org-scoped, that vault and programmatic endpoints are correctly scoped, and the existing `secret.reveal_denied` UI label. | `WITHUS_SECURITY_REMEDIATION_STATUS.md` | None | Updated |
| 2026-11-10 | Claude Code (Phase 1) | **F-002 fixed.** `encryptPayload` returns `fingerprint: ''` instead of SHA-256(plaintext). The DEK fingerprint (`encryptDEK`/`rewrapDEK`, `rotate-mek.ts`) is unchanged. No schema change. Spec updated to assert that no plaintext hash is produced. | `apps/api/src/vaults/encryption.service.ts`, `apps/api/src/vaults/encryption.service.spec.ts` | `npx jest src/vaults --moduleFileExtensions ts js json` | 27/27 pass |
| 2026-11-10 | Claude Code (Phase 1) | **F-003 fixed.** New private `SessionsService.assertActiveMember()` checks `organizationMember` by `organizationId_userId` with `removedAt === null`. It throws 403 in `revealSecretViaSession` and `launchSessionForExtension`, after the existing session validation and before decryption. `/otp` gets the same inline check and follows that handler's `{ error }` return pattern. Confirmed that grantees are always picked from org members (`CreateSessionModal.tsx:205,385`), so legitimate sessions are unaffected. No change to session creation, expiry, usage limits, remove, or offboard. | `apps/api/src/sessions/sessions.service.ts`, `apps/api/src/sessions/controllers/sessions.controller.ts`, `apps/api/src/sessions/controllers/sessions.controller.otp.spec.ts` (mock and 2 new tests), **new** `apps/api/src/sessions/sessions.service.membership.spec.ts` (6 tests) | `npx jest src/sessions --moduleFileExtensions ts js json`; OTP spec also under the default config | 16/16 pass; 10/10 under default |
| 2026-11-10 | Claude Code (Phase 1) | **F-004 fixed.** New private `SecretsController.assertVaultInOrg(orgId, vaultId)` runs `prisma.vault.findFirst({ id, organizationId })` and throws 404 `'Vault not found'`. It is called before `createSecret`, `getSecrets`, and `getSecretById`. Detail also returns 404 when `secret.vaultId !== :vaultId`. It intentionally does **not** filter `deletedAt`, so soft-deleted-vault behaviour is unchanged. Response shapes are unchanged. Confirmed that the web app always calls these with the secret's own org and vault (`apps/web/lib/api/secrets.ts:19-39`). Reveal, update, and delete were already org-checked and are untouched. | `apps/api/src/vaults/controllers/secrets.controller.ts`, **new** `apps/api/src/vaults/controllers/secrets.controller.tenant.spec.ts` (3 tests) | `npx jest src/vaults --moduleFileExtensions ts js json`; `npx tsc --noEmit` (apps/api) | 30/30 pass; typecheck clean |
| 2026-11-10 | Claude Code (Phase 1) | **F-005 fixed.** Text-only rewording; layout, classes, icons, and section structure unchanged. Changes: "TLS 1.3" → "HTTPS (TLS)"; "Zero Raw Credential Exposure … memory wiped clean" → "No Credential Storage in the Browser" (accurate); cookie claim with "SameSite and strict domain pinning" → "Secure, HTTP-only cookies"; roles corrected to Owner/Admin/Member plus delegated sessions (there is no "Delegate" role); "Immutable Audit Logging … every authentication attempt … IP fingerprint" → "Audit Logging" listing the events actually recorded; "cryptographically segmented" → access-check isolation plus AAD binding to the org; "24/7 anomaly detection … automated containment" → rate limiting plus error monitoring (Sentry is configured in `apps/web/next.config.js`). `lastUpdated` set to November 10, 2026. **PITR claim left unchanged and flagged for the user.** | `apps/web/app/security/page.tsx` | `npx tsc --noEmit` (apps/web) | Clean |
| 2026-11-10 | Claude Code | **F-007 fixed (source only).** Replaced the real example credential in the comment with placeholders. No history rewrite, per the user. | `apps/extension/src/background/service-worker.ts` (1 line) | `git grep` confirms no remaining occurrences | Done |
| 2026-11-10 | Claude Code (F-001) | **F-001 fixed (user-approved design).** `main.ts` CORS: removed `origin==='null'` and the `includes('smartgateway'/'juspay'/'hdfcbank'/'loca.lt')` rules; disallowed origins → `callback(null, false)` instead of `callback(new Error)`, so requests are processed without CORS headers. This keeps HDFC return navigations working. `csrf.middleware.ts`: the bypass requires `Authorization: Bearer …` plus the extension header, and on that path `req.cookies.sdap_token` is deleted so JWT auth uses the Bearer token (global extractor order unchanged). Payment code, HDFC exemptions, `/auth/*` exemptions, and the `[CORS DEBUG]` log are untouched. Not booted against a real DB (schedulers could act on HDFC mandates). | `apps/api/src/main.ts`, `apps/api/src/common/middleware/csrf.middleware.ts`, **new** `apps/api/src/common/middleware/csrf-cors.security.spec.ts` (18 tests: real CSRF middleware and JwtStrategy through Express + supertest; CORS callback copied verbatim from `main.ts`) | Baseline: billing/auth/sessions/vaults 16 suites, 262/262 (TS-first). Final: plus `src/common`, 18 suites, 285/285 (TS-first). Default config: same 16 pre-existing stale-`.js` failures before and after. `tsc --noEmit` clean. | Pass |
| 2026-11-10 | Claude Code (F-001 verification) | Rewrote `csrf-cors.security.spec.ts` to test the **real** `main.ts` instead of a copy. `NestFactory.create` is mocked and `AppModule` stubbed, so importing `main.ts` runs the real `bootstrap()` (production branch) against a recorder, with no DB, schedulers, or listen. Every recorded call (helmet, `enableCors`, `cookieParser`, `csrfMiddleware`, rate limit, body parsers, filter, prefix) is replayed in order onto a Nest test app serving the **real** `BillingController` and `HdfcWebhookGuard` (with `BillingService` and the signature check mocked), plus routes behind the real `JwtAuthGuard`/`JwtStrategy`. The test also asserts registration order: CORS, then cookies, then CSRF, with guards running after middleware per Nest. No production file changed in this pass. | `apps/api/src/common/middleware/csrf-cors.security.spec.ts` (21 tests) | TS-first: 18 suites, 288/288. Default: same 16 pre-existing stale-`.js` failures. `tsc` clean. | Pass |
