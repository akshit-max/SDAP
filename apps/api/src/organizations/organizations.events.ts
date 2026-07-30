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
    /** The raw (unhashed) invite token — used to construct the invite URL in email */
    public readonly rawToken: string,
  ) {}
}

export class InvitationAcceptedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}
}
