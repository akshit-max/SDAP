# ADR-006: Vault Architecture

## Status
Accepted

## Context
SDAP (Secure Delegated Access Platform) requires a core module to securely store, version, and manage access to secrets (Vaults). A Vault is a logical container for encrypted secrets. The Vault module is the central domain of the platform, enabling organizations to manage credentials and delegate access to members without exposing the raw secrets unnecessarily.

This document defines the domain model, secret lifecycle, and API contracts. The cryptographic specifics (envelope encryption, AAD, algorithms) are delegated to [ADR-007 Cryptographic Design](./ADR-007-cryptographic-design.md).

## Domain Model
- **Vault**: A container for secrets, belonging to an `Organization`. Includes future-proofing fields for `defaultTTL` and `rotationPolicy`.
- **Secret**: An encrypted key-value pair or credential set stored within a Vault. Includes metadata like `type` and `status`.
- **SecretType**: An enum categorizing the secret (e.g., `PASSWORD`, `API_KEY`, `TOKEN`, `SSH_KEY`, `CERTIFICATE`, `OAUTH`, `COOKIE`, `TEXT`, `JSON`, `OTHER`) to aid validation, rendering, and future rotation integrations.
- **SecretVersion**: An immutable record of a Secret's state at a specific point in time. All updates create a new version.
- **VaultAccess**: A policy granting a specific `User` (or role) access to a `Vault` under certain conditions.
- **AccessSession**: A temporary, time-bounded session granting the ability to decrypt specific secrets, bound to specific device constraints (IP, User Agent).

## Secret Lifecycle & Versioning
1. **Creation**: A secret is created within a Vault. The plaintext is encrypted by the `EncryptionService`. A `Secret` record and its initial `SecretVersion` (v1) are created.
2. **Reading (Reveal)**: A user requests a secret reveal. The system verifies RBAC/VaultAccess. An **Audit Event** is explicitly recorded. The system fetches the latest `SecretVersion`, decrypts it, and returns the plaintext over TLS. 
3. **Updating**: An existing secret is modified via a `PATCH` request to the `Secret` resource. A new, immutable `SecretVersion` (v2) is appended internally. The backend abstracts the versioning from the client.
4. **Deletion**: Deletion is strictly **soft-delete**. The `Secret` and its `SecretVersion`s receive a `deletedAt` timestamp. Hard-deletion is never performed immediately; a separate `RetentionPolicy` background job will handle crypto-shredding and permanent purge after a safe delay (e.g., 90 days).

## Delegated Session Flow & Browser Extension
1. **Session Request**: The browser extension requests access to a specific Vault or Secret.
2. **Policy Evaluation**: The backend evaluates `VaultAccess` rules.
3. **Session Issuance**: If approved, an `AccessSession` is created with a strict TTL (e.g., 15 minutes) and bound to `deviceId`, `userAgent`, and `ip`.
4. **Usage**: The extension uses the Session Token. The backend verifies the session is active and context matches, then reveals the secret (emitting an audit event).
5. **Revocation**: Sessions expire automatically or can be explicitly revoked.

## Threat Model & Mitigations
- **Database Compromise**: Attackers gaining full DB access cannot read secrets because the Master Encryption Key (MEK) is not in the DB. Envelope encryption prevents offline decryption of Data Encryption Keys (DEKs).
- **Log Leakage**: Plaintext secrets are strictly prohibited from appearing in application logs, error messages, or exception traces. The `GlobalExceptionFilter` helps enforce this.
- **Replay Attacks & Token Theft**: Session tokens are short-lived and cryptographically bound to the client environment (`ip`, `userAgent`, `deviceId`).
- **Insider Threat (Admin)**: Strict RBAC and mandatory audit logging on every `reveal` ensure that even Org Owners accessing secrets leave a permanent trail.

## Database Schema (Proposed)
```prisma
enum SecretType {
  PASSWORD
  API_KEY
  TOKEN
  SSH_KEY
  CERTIFICATE
  OAUTH
  COOKIE
  TEXT
  JSON
  OTHER
}

enum SecretStatus {
  ACTIVE
  DISABLED
  PENDING_ROTATION
  DELETED
}

model Vault {
  id             String    @id @default(uuid())
  organizationId String
  name           String
  description    String?
  defaultTTL     Int?      // Future: Default session TTL in seconds
  rotationPolicy Json?     // Future: Auto-rotation configuration
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  secrets        Secret[]

  @@index([organizationId])
}

model Secret {
  id             String       @id @default(uuid())
  vaultId        String
  name           String       // Case-insensitive uniqueness enforcement handled at app layer
  description    String?
  type           SecretType   @default(OTHER)
  status         SecretStatus @default(ACTIVE)
  encryptedDek   String       // DEK encrypted by MEK
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  vault          Vault           @relation(fields: [vaultId], references: [id], onDelete: Cascade)
  versions       SecretVersion[]

  @@index([vaultId])
  @@unique([vaultId, name])
}

model SecretVersion {
  id             String    @id @default(uuid())
  secretId       String
  version        Int
  ciphertext     String    // Base64 encoded encrypted payload (using DEK)
  iv             String    // Base64 encoded Initialization Vector
  authTag        String    // Base64 encoded GCM Auth Tag
  algorithm      String    @default("AES-256-GCM")
  keyVersion     Int       @default(1) // Tracks MEK version for future rotation
  aadHash        String?   // Hash of the AAD used during encryption
  createdBy      String
  createdAt      DateTime  @default(now())
  deletedAt      DateTime? // Soft delete only

  secret         Secret    @relation(fields: [secretId], references: [id], onDelete: Cascade)

  @@index([secretId])
  @@unique([secretId, version])
}
```

## API Contracts (Proposed)
- `POST /api/v1/organizations/:orgId/vaults`
- `GET /api/v1/organizations/:orgId/vaults`
- `POST /api/v1/vaults/:vaultId/secrets`
- `GET /api/v1/vaults/:vaultId/secrets`
- `PATCH /api/v1/secrets/:secretId` (Updates secret, internally creates new version)
- `GET /api/v1/secrets/:secretId/reveal` (Emits audit event, returns plaintext)

## Consequences
- Requires rigorous environment variable management for the MEK.
- Database size will grow monotonically due to immutable versioning and strict soft-delete policies.
- Client logic is simplified as version creation is managed internally via standard REST semantics.
