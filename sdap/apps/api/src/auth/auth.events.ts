export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}

export class RefreshRotatedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldFamilyId: string,
  ) {}
}

export class RefreshReuseDetectedEvent {
  constructor(
    public readonly userId: string,
    public readonly familyId: string,
    public readonly ipAddress?: string,
  ) {}
}
