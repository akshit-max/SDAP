export class DelegatedSessionRevokedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly organizationId: string,
    public readonly revokedByUserId: string,
    public readonly durationSeconds?: number,
    public readonly platform?: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
