import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * MailerService — the single transport abstraction for all outbound email.
 *
 * In development/test (NODE_ENV !== 'production'):
 *   Uses Ethereal (https://ethereal.email) — a fake SMTP server that
 *   captures emails without delivering them. The preview URL is logged
 *   so you can inspect the email without configuring real SMTP.
 *
 * In production:
 *   Uses SMTP credentials from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Architectural contract: Extend this service only by adding new send*()
 * helper methods. Never instantiate nodemailer outside this service.
 * Email transport is an infrastructure concern — it must not leak into
 * domain services.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;
  private readonly isProduction: boolean;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    this.from =
      config.get<string>('SMTP_FROM') ?? 'WITHUS <noreply@withus.app>';
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    if (this.isProduction) {
      this.transporter = nodemailer.createTransport({
        host: this.config.getOrThrow<string>('SMTP_HOST'),
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: this.config.getOrThrow<string>('SMTP_USER'),
          pass: this.config.getOrThrow<string>('SMTP_PASS'),
        },
      });
    } else {
      // Development / test: use Ethereal for email preview
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(
        `[DEV] Ethereal email account: ${testAccount.user} / ${testAccount.pass}`,
      );
    }

    return this.transporter;
  }

  async send(options: MailOptions): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (!this.isProduction) {
        // Log the Ethereal preview URL so devs can inspect the email
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`[DEV] Email preview URL: ${previewUrl}`);
      }

      this.logger.log(`Email delivered to ${options.to}: ${options.subject}`);
    } catch (error) {
      // Email failure must never propagate to the caller — log and continue.
      // The underlying invite token was already created in the database.
      this.logger.error(
        `Failed to send email to ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
