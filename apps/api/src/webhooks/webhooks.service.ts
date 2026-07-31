import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface DeliveryPayload {
  id: string;
  event: string;
  organizationId: string;
  timestamp: string;
  data: unknown;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [0, 5000, 30000]; // immediate, 5s, 30s

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Subscription CRUD ────────────────────────────────────────────────────

  async createSubscription(
    organizationId: string,
    url: string,
    events: string[],
    description?: string,
  ) {
    const secret = `whsec_${crypto.randomBytes(24).toString('base64url')}`;
    
    const sub = await this.prisma.webhookSubscription.create({
      data: {
        organizationId,
        url,
        events,
        secret,
        active: true,
      },
    });
    
    this.logger.log(`[WEBHOOK] Created subscription ${sub.id} for org ${organizationId} → ${url}`);
    return sub;
  }

  async listSubscriptions(organizationId: string) {
    const subs = await this.prisma.webhookSubscription.findMany({
      where: { organizationId, active: true },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        // Never return the signing secret in list
      },
    });
    return subs;
  }

  async deleteSubscription(organizationId: string, subscriptionId: string): Promise<void> {
    await this.prisma.webhookSubscription.deleteMany({
      where: { id: subscriptionId, organizationId },
    });
  }

  // ─── Event Delivery ───────────────────────────────────────────────────────

  async deliver(eventName: string, organizationId: string, data: unknown): Promise<void> {
    const matching = await this.prisma.webhookSubscription.findMany({
      where: { 
        organizationId, 
        active: true,
        events: { has: eventName } 
      },
    });

    if (matching.length === 0) return;

    const payload: DeliveryPayload = {
      id: crypto.randomUUID(),
      event: eventName,
      organizationId,
      timestamp: new Date().toISOString(),
      data,
    };

    await Promise.allSettled(matching.map((sub) => this.deliverToSubscriber(sub, payload)));
  }

  private async deliverToSubscriber(
    sub: any,
    payload: DeliveryPayload,
    attempt = 0,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = this.sign(sub.secret, body);

    const delay = RETRY_DELAYS_MS[attempt] ?? 0;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WITHUS-Event': payload.event,
          'X-WITHUS-Delivery': payload.id,
          'X-WITHUS-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      this.logger.log(`[WEBHOOK] Delivered ${payload.event} to ${sub.url} (attempt ${attempt + 1})`);
    } catch (err: unknown) {
      const errMsg = (err as Error).message;
      this.logger.warn(
        `[WEBHOOK] Delivery failed to ${sub.url} (attempt ${attempt + 1}): ${errMsg}`,
      );

      if (attempt < MAX_RETRIES - 1) {
        await this.deliverToSubscriber(sub, payload, attempt + 1);
      } else {
        this.logger.error(`[WEBHOOK] Exhausted retries for ${payload.event} → ${sub.url}`);
        // Mark subscription as errored if all retries fail
        await this.prisma.webhookSubscription.update({
          where: { id: sub.id },
          data: { active: false },
        });
      }
    }
  }

  private sign(secret: string, body: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────

  @OnEvent('session.created')
  onSessionCreated(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('session.created', data.organizationId, data).catch(() => {});
  }

  @OnEvent('session.revoked')
  onSessionRevoked(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('session.revoked', data.organizationId, data).catch(() => {});
  }

  @OnEvent('approval.approved')
  onApprovalApproved(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('approval.approved', data.organizationId, data).catch(() => {});
  }

  @OnEvent('approval.rejected')
  onApprovalRejected(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('approval.rejected', data.organizationId, data).catch(() => {});
  }

  @OnEvent('integration.connected')
  onIntegrationConnected(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('integration.connected', data.organizationId, data).catch(() => {});
  }

  @OnEvent('integration.disconnected')
  onIntegrationDisconnected(data: { organizationId: string; [k: string]: unknown }) {
    this.deliver('integration.disconnected', data.organizationId, data).catch(() => {});
  }
}
