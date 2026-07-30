import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { NotificationListenerService } from './notification-listener.service';

/**
 * NotificationsModule
 *
 * Self-contained module owning all outbound notification concerns.
 * - MailerService: email transport infrastructure
 * - NotificationListenerService: domain event → notification routing
 *
 * To add a new notification type:
 *   1. Add a @OnEvent() handler to NotificationListenerService
 *   2. Add a build*EmailHtml() method for the template
 *   No other files need modification.
 *
 * To switch email providers (e.g. SendGrid, Resend, AWS SES):
 *   Replace the nodemailer transport inside MailerService.
 *   No other files need modification.
 */
@Module({
  providers: [MailerService, NotificationListenerService],
  exports: [MailerService],
})
export class NotificationsModule {}
