// Vault Events
export class VaultCreatedEvent {
  static readonly EVENT_NAME = 'vault.created';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly actorId: string,
  ) {}
}

export class VaultUpdatedEvent {
  static readonly EVENT_NAME = 'vault.updated';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly actorId: string,
  ) {}
}

export class VaultDeletedEvent {
  static readonly EVENT_NAME = 'vault.deleted';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly actorId: string,
  ) {}
}

// Secret Events
export class SecretCreatedEvent {
  static readonly EVENT_NAME = 'secret.created';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
  ) {}
}

export class SecretUpdatedEvent {
  static readonly EVENT_NAME = 'secret.updated';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
  ) {}
}

export class SecretDeletedEvent {
  static readonly EVENT_NAME = 'secret.deleted';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
  ) {}
}

export class SecretRevealRequestedEvent {
  static readonly EVENT_NAME = 'secret.reveal.requested';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
    public readonly userAgent: string,
    public readonly ipAddress: string,
  ) {}
}

export class SecretRevealSucceededEvent {
  static readonly EVENT_NAME = 'secret.reveal.succeeded';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
  ) {}
}

export class SecretRevealFailedEvent {
  static readonly EVENT_NAME = 'secret.reveal.failed';
  constructor(
    public readonly organizationId: string,
    public readonly vaultId: string,
    public readonly secretId: string,
    public readonly actorId: string,
    public readonly reason: string,
  ) {}
}
