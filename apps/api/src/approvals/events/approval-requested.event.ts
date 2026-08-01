import { ApprovalType } from '@repo/types';
import { CreateSessionDto } from '../../sessions/dto/sessions.dto';

export class ApprovalRequestedEvent {
  constructor(
    public readonly approvalId: string,
    public readonly organizationId: string,
    public readonly requesterId: string,
    public readonly type: ApprovalType,
    public readonly requestPayload: CreateSessionDto,
    public readonly timestamp: Date = new Date(),
  ) {}
}
