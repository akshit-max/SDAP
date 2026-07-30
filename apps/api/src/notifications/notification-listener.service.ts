import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { MemberInvitedEvent } from '../organizations/organizations.events';
import { MailerService } from './mailer.service';

/**
 * NotificationListenerService
 *
 * Listens to domain events and delivers email notifications.
 * Uses the same @OnEvent pattern as AuditListenerService — extend
 * this class for any new notification type; never scatter email
 * logic across other services.
 *
 * Architectural contract: This service is the ONLY place that sends
 * outbound email. All other services emit events; this service handles
 * delivery. This separation ensures email failures never break the
 * originating business transaction.
 */
@Injectable()
export class NotificationListenerService {
  private readonly logger = new Logger(NotificationListenerService.name);
  private readonly appUrl: string;

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  @OnEvent('member.invited', { async: true })
  async handleMemberInvited(event: MemberInvitedEvent) {
    const inviteUrl = `${this.appUrl}/invite?token=${event.rawToken}`;

    this.logger.log(
      `Sending invite email to ${event.email} for org ${event.organizationId}`,
    );

    await this.mailer.send({
      to: event.email,
      subject: 'You have been invited to join WITHUS',
      html: this.buildInviteEmailHtml(inviteUrl),
      text: `You have been invited to join a WITHUS organization. Accept your invitation here: ${inviteUrl}\n\nThis link expires in 7 days.`,
    });
  }

  private buildInviteEmailHtml(inviteUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to WITHUS</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: #0f172a; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            🔐 WITHUS
          </div>
        </div>
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-align: center;">
          You've been invited
        </h1>
        <p style="font-size: 14px; color: #64748b; margin: 0 0 32px 0; text-align: center; line-height: 1.6;">
          You've been invited to join a secure vault workspace on WITHUS.
          Accept your invitation below to get started.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${inviteUrl}"
             style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.6;">
          This invitation expires in <strong>7 days</strong>.<br />
          If you did not expect this email, you can safely ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #cbd5e1; text-align: center; margin: 0;">
          WITHUS — Secure Delegated Access Platform
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
