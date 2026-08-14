export class DelegatedSessionExpiredEvent {
  constructor(
    public readonly sessionId: string,
    public readonly organizationId: string,
    public readonly durationSeconds: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
