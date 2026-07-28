# ADR-007: Cryptographic Design

## Status
Accepted

## Context
SDAP stores highly sensitive credentials. The cryptographic strategy must ensure data confidentiality, integrity, and authenticity while remaining future-proof for key rotation, HSM (Hardware Security Module) integration, and enterprise KMS (Key Management Service) support.

This document abstracts the cryptographic architecture away from the Vault domain model (described in [ADR-006](./ADR-006-vault-architecture.md)).

## Decisions

### 1. Envelope Encryption
Secrets will **not** be encrypted directly by the Master Encryption Key (MEK). Instead, an **Envelope Encryption** architecture will be used:
1. **Master Encryption Key (MEK)**: The root key. Not stored in the database. Injected via environment variables (`VAULT_ENCRYPTION_KEY`) or KMS.
2. **Data Encryption Key (DEK)**: A unique, randomly generated symmetric key for each `Secret` (or `Vault`).
3. **Storage**: The DEK is encrypted by the MEK and stored in the database (`encryptedDek`). The secret payload is encrypted by the DEK and stored in `SecretVersion`.

**Why?**
- **Key Rotation**: To rotate the MEK, only the DEKs need to be re-encrypted. The actual secret payloads (which could be gigabytes across millions of records) remain untouched.
- **Crypto-Shredding**: Deleting the DEK immediately renders all versions of that secret permanently unrecoverable, regardless of backups.
- **KMS Integration**: Eases future migration to AWS KMS or Azure Key Vault, where the KMS acts as the MEK.

### 2. Algorithms
- **Algorithm**: `AES-256-GCM` (Galois/Counter Mode).
- **Key Size**: 256 bits (32 bytes).
- **Initialization Vector (IV)**: 96 bits (12 bytes), cryptographically secure pseudorandom number generator (CSPRNG). A unique IV is generated for *every* encryption operation.
- **Authentication**: GCM inherently provides an Authentication Tag (128 bits / 16 bytes), ensuring the ciphertext has not been tampered with.

### 3. Additional Authenticated Data (AAD)
AES-GCM supports AAD, which binds the ciphertext to specific context without encrypting the context itself. 
We will bind every `SecretVersion` payload to its logical database hierarchy:
- `organizationId`
- `vaultId`
- `secretId`
- `version`

**Why?**
If an attacker manipulates the database to copy the ciphertext from Secret A (which they can access) to Secret B (which they cannot), the decryption will fail because the AAD context (the IDs) will not match. This prevents ciphertext relocation attacks.

### 4. Key Hierarchy & Versioning
- The MEK will be tracked via a `KeyMetadata` table in the database.
- The `SecretVersion` and `Secret` records will store a foreign key (`keyMetadataId`) referencing the specific key version used during encryption.
- This provides an operational history of algorithm changes, rotation timestamps, and KMS identifiers without altering the Secret schema, and supports multiple active MEKs simultaneously during a key rotation phase.

### 5. Fingerprints
- Every `SecretVersion` will store a `fingerprint` (e.g., `SHA-256(plaintext)`).
- This is strictly used for operational integrity, duplicate detection, and rotation comparison.
- **Rule**: Fingerprints must never be exposed in public APIs unless explicitly required, and are never used as an authentication mechanism.

### 6. Constant-Time Behavior & Error Normalization
- Cryptographic failure paths must avoid leaking information through timing differences.
- "Constant-time" in this application context means normalizing error handling so that "Secret not found", "Unauthorized", and "Decryption failed (tampered ciphertext)" result in the same generic application response latency and structure where practical.
- Decryption exceptions must be swallowed and normalized (e.g., "Unable to reveal secret"), while non-sensitive operational details are logged internally.

### 7. Dedicated Encryption Service
All cryptographic operations will be centralized in a dedicated `EncryptionService`. 
No business logic service (`SecretsService`, `VaultsService`) is permitted to directly invoke Node.js `crypto` functions for secret encryption/decryption. 

The `EncryptionService` interface must support:
- `generateDEK()`
- `encryptDEK(dek: Buffer): Buffer`
- `decryptDEK(encryptedDek: Buffer): Buffer`
- `encryptPayload(plaintext: string, dek: Buffer, aad: string): { ciphertext, iv, authTag }`
- `decryptPayload(ciphertext, dek, iv, authTag, aad): string`

## Consequences
- Requires strict management of the MEK.
- Slight performance overhead due to the two-step decryption process (decrypt DEK -> decrypt payload), mitigated by DEK caching if necessary.
- Prevents database-level relocation attacks via AAD.
- Future-proofs the platform for enterprise compliance (key rotation, KMS).
