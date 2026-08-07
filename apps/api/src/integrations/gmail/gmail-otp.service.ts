import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { OTP_PATTERNS } from './otp-patterns';

/**
 * GmailOtpService
 *
 * Responsible ONLY for:
 *  1. Searching the grantor's Gmail inbox for a recent OTP email.
 *  2. Extracting the OTP code using the platform-specific pattern registry.
 *  3. Returning the raw code string — nothing else.
 *
 * OAuth Boundary Rule:
 *   All Google API calls are confined to this module.
 *   This service NEVER imports the googleapis SDK.
 *   All calls are made via native fetch() to Google's REST API.
 *
 * OTP Boundary Rule:
 *   This service returns only the extracted OTP string.
 *   It never returns email body, subject, sender, or metadata.
 */
@Injectable()
export class GmailOtpService {
  private readonly logger = new Logger(GmailOtpService.name);

  private readonly GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

  /**
   * Search the grantor's inbox for a recent OTP email and extract the code.
   *
   * @param accessToken  Valid Gmail access token (decrypted from IntegrationConnection)
   * @param platform     The integrationProvider of the DelegatedSession (e.g. 'STRIPE')
   * @returns            The extracted OTP code string
   */
  async fetchLatestOtp(accessToken: string, platform: string | null, loginStartTime: number): Promise<string> {
    // ── Build search query ──────────────────────────────────────────────────
    const query = this.buildSearchQuery(platform);
    this.logger.debug(`[OTP] Gmail search: q="${query}" platform="${platform}"`);

    // Poll up to 8 times (~16 seconds max waiting)
    for (let attempt = 0; attempt < 8; attempt++) {
      // ── Search for matching messages ────────────────────────────────────────
      const listRes = await this.gmailGet(
        `/messages?q=${encodeURIComponent(query)}&maxResults=5`,
        accessToken,
      );

      const messages: Array<{ id: string; threadId: string }> = listRes.messages ?? [];

      // ── Fetch each message body and attempt extraction ──────────────────────
      for (const { id } of messages) {
        const message = await this.gmailGet(`/messages/${id}?format=full`, accessToken);
        
        // Filter by internalDate (millisecond timestamp). Allow 15 seconds of clock skew.
        const internalDate = parseInt(message.internalDate, 10);
        if (internalDate < loginStartTime - 15000) {
          // Message is too old. Because Gmail returns newest-first, all subsequent
          // messages in this array will also be too old.
          break;
        }

        const body = this.extractEmailBody(message);
        const sender = this.extractSender(message);

        // PHASE 3 DEBUG LOGGING — remove before production
        this.logger.debug(`[OTP-DEBUG] Message id="${id}" sender="${sender}" internalDate="${internalDate}"`);
        this.logger.debug(`[OTP-DEBUG] Body snippet: ${body?.slice(0, 200)}`);

        if (!body) continue;

        const otp = this.extractOtp(body, sender, platform);

        // PHASE 3 DEBUG LOGGING — remove before production
        this.logger.debug(`[OTP-DEBUG] Extracted OTP: ${otp ?? 'null (no match)'}`);

        if (otp) {
          this.logger.log(`[OTP] Extracted code for platform="${platform}" from message id="${id}"`);
          return otp;
        }
      }

      // If we reach here, we found no NEW matching OTP email in this poll cycle.
      // Wait 2 seconds before trying again.
      this.logger.debug(`[OTP] No new OTP found on attempt ${attempt + 1}/8. Retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new NotFoundException(
      'No OTP email found. Please request a new verification code.',
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Builds a Gmail search query that prefers platform-specific sender filtering.
   * Falls back to generic keyword search if no platform sender is known.
   */
  private buildSearchQuery(platform: string | null): string {
    const baseWindow = 'newer_than:5m in:inbox';

    // Platform-specific sender domains (prefer this over generic keyword search)
    const senderMap: Record<string, string> = {
      GITHUB: 'from:(github.com OR noreply.github.com)',
      STRIPE: 'from:stripe.com',
      SHOPIFY: 'from:(shopify.com OR mail.shopify.com)',
      LINKEDIN: 'from:(linkedin.com OR e.linkedin.com)',
      RAZORPAY: 'from:razorpay.com',
      VERCEL: 'from:vercel.com',
      GODADDY: 'from:godaddy.com',
    };

    const senderFilter = platform && senderMap[platform] ? senderMap[platform] : null;

    if (senderFilter) {
      return `${baseWindow} ${senderFilter}`;
    }

    // Generic keyword fallback
    return `${baseWindow} (OTP OR verification OR "verify" OR "one-time" OR "passcode")`;
  }

  /**
   * Applies OTP_PATTERNS in priority order:
   *   1. Platform-specific regex
   *   2. Sender-domain regex
   *   3. Generic fallback
   */
  private extractOtp(body: string, sender: string, platform: string | null): string | null {
    for (const pattern of OTP_PATTERNS) {
      // Platform filter
      if (pattern.platform && pattern.platform !== platform) continue;

      // Sender domain filter
      if (pattern.senderDomains && pattern.senderDomains.length > 0) {
        const matchesSender = pattern.senderDomains.some(d => sender.toLowerCase().includes(d));
        if (!matchesSender) continue;
      }

      const match = body.match(pattern.regex);
      if (match && match[pattern.group] != null) {
        return match[pattern.group] as string;
      }
    }
    return null;
  }

  private extractEmailBody(message: any): string | null {
    const payload = message?.payload;
    if (!payload) return null;

    // Recursively collect all MIME parts at any nesting depth
    const collectParts = (part: any): any[] => {
      const results: any[] = [part];
      if (part?.parts) {
        for (const child of part.parts) {
          results.push(...collectParts(child));
        }
      }
      return results;
    };

    const allParts = collectParts(payload);

    // Prefer text/plain — cleanest for regex matching, no HTML noise
    const plainPart = allParts.find(p => p?.mimeType === 'text/plain' && p?.body?.data);
    if (plainPart) {
      return Buffer.from(plainPart.body.data, 'base64url').toString('utf8');
    }

    // Fallback to text/html with tags stripped
    const htmlPart = allParts.find(p => p?.mimeType === 'text/html' && p?.body?.data);
    if (htmlPart) {
      const html = Buffer.from(htmlPart.body.data, 'base64url').toString('utf8');
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    }

    return null;
  }

  /**
   * Extracts the sender email address from the message headers.
   */
  private extractSender(message: any): string {
    const headers: Array<{ name: string; value: string }> = message?.payload?.headers ?? [];
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
    return fromHeader?.value ?? '';
  }

  /**
   * Makes an authenticated GET request to the Gmail REST API.
   * Throws ServiceUnavailableException on non-2xx responses.
   */
  private async gmailGet(path: string, accessToken: string): Promise<any> {
    const res = await fetch(`${this.GMAIL_API}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) {
      throw new ServiceUnavailableException(
        'Gmail access token is invalid or expired. Please reconnect Gmail.',
      );
    }

    if (res.status === 429) {
      throw new ServiceUnavailableException(
        'Gmail API rate limit exceeded. Please try again in a moment.',
      );
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Gmail API error ${res.status}: ${body.slice(0, 200)}`,
      );
    }

    return res.json();
  }
}
