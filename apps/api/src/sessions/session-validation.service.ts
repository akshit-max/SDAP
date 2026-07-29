import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DelegatedSession, SessionStatus } from '@prisma/client';

@Injectable()
export class SessionValidationService {
  /**
   * Validates if a session is currently usable.
   * Throws UnauthorizedException if invalid.
   */
  validateSessionForUse(session: DelegatedSession, granteeId: string) {
    if (session.granteeId !== granteeId) {
      throw new UnauthorizedException(
        'You are not the grantee of this session.',
      );
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Session is ${session.status.toLowerCase()}.`,
      );
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired.');
    }

    if (
      session.maxReveals !== null &&
      session.revealCount >= session.maxReveals
    ) {
      throw new UnauthorizedException(
        'Session has reached its maximum allowed uses.',
      );
    }

    return true;
  }
}
