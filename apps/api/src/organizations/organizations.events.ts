export class OrganizationCreatedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly creatorId: string,
  ) {}
}

export class MemberInvitedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly email: string,
    public readonly inviterId: string,
  ) {}
}

export class InvitationAcceptedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}
}
