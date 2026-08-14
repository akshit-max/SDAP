export class DelegatedSessionCreatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly organizationId: string,
    public readonly grantorId: string,
    public readonly granteeId: string,
    public readonly scope: string,
    public readonly resourceId: string,
    public readonly platform?: string,
    public readonly reason?: string,
    public readonly expiresAt?: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
