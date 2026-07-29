export class ApprovalApprovedEvent {
  constructor(
    public readonly approvalId: string,
    public readonly organizationId: string,
    public readonly resolvedByUserId: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
