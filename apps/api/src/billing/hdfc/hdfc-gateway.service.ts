import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  HdfcSessionRequest,
  HdfcSessionResponse,
  HdfcOrderStatusResponse,
  HdfcMandateExecuteRequest,
  HdfcMandateExecuteResponse,
  HdfcMandateStatusResponse,
  HdfcMandateRevokeResponse,
  HdfcRefundRequest,
  HdfcRefundRecord,
} from './hdfc-types';

/**
 * HdfcGatewayService
 *
 * All outbound calls to HDFC SmartGateway API.
 * Authentication: HTTP Basic Auth — base64(apiKey) — apiKey alone, NOT "user:pass".
 * Uses Node.js native fetch (Node 18+) — no external HTTP library needed.
 *
 * Three credential sets — NEVER mixed:
 *   HDFC_API_KEY        → this service (outbound API calls)
 *   HDFC_RESPONSE_KEY   → HdfcSignatureService (return URL HMAC)
 *   HDFC_WEBHOOK_*      → HdfcSignatureService (webhook Basic Auth)
 */
@Injectable()
export class HdfcGatewayService {
  private readonly logger = new Logger(HdfcGatewayService.name);
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly merchantId: string;
  private readonly clientId: string;
  private readonly resellerId: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.getOrThrow<string>('HDFC_BASE_URL');
    this.merchantId = this.config.getOrThrow<string>('HDFC_MERCHANT_ID');
    this.clientId = this.config.getOrThrow<string>('HDFC_CLIENT_ID');
    this.resellerId = this.config.getOrThrow<string>('HDFC_RESELLER_ID');
    const apiKey = this.config.getOrThrow<string>('HDFC_API_KEY');
    this.authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
      'x-merchantid': this.merchantId,
      'x-customerid': this.clientId,
      'x-resellerid': this.resellerId,
    };
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: object,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `HDFC API ${method} ${path} returned ${res.status}: ${text.substring(0, 200)}`,
      );
    }

    return res.json() as Promise<T>;
  }

  async createSessionWithMandate(
    body: HdfcSessionRequest,
  ): Promise<HdfcSessionResponse> {
    this.logger.log(`[SESSION] Creating session for order ${body.order_id}`);
    return this.request<HdfcSessionResponse>('POST', '/session', body);
  }

  async getOrderStatus(orderId: string): Promise<HdfcOrderStatusResponse> {
    this.logger.log(`[ORDER STATUS] Fetching order ${orderId}`);
    return this.request<HdfcOrderStatusResponse>(
      'GET',
      `/orders/${encodeURIComponent(orderId)}`,
    );
  }

  async executeMandateCharge(
    mandateId: string,
    body: HdfcMandateExecuteRequest,
  ): Promise<HdfcMandateExecuteResponse> {
    this.logger.log(
      `[MANDATE EXECUTE] Mandate ${mandateId}, order ${body.order_id}, amount ${body.amount}`,
    );
    return this.request<HdfcMandateExecuteResponse>(
      'POST',
      `/mandates/v2/execute/${encodeURIComponent(mandateId)}`,
      body,
    );
  }

  async getMandateStatus(
    mandateId: string,
  ): Promise<HdfcMandateStatusResponse> {
    this.logger.log(`[MANDATE STATUS] Checking ${mandateId}`);
    return this.request<HdfcMandateStatusResponse>(
      'POST',
      `/mandates/v2/status/${encodeURIComponent(mandateId)}`,
      {},
    );
  }

  async revokeMandate(mandateId: string): Promise<HdfcMandateRevokeResponse> {
    this.logger.log(`[MANDATE REVOKE] Revoking ${mandateId}`);
    return this.request<HdfcMandateRevokeResponse>(
      'POST',
      `/mandates/v2/revoke/${encodeURIComponent(mandateId)}`,
      {},
    );
  }

  async refundOrder(
    orderId: string,
    body: HdfcRefundRequest,
  ): Promise<HdfcRefundRecord> {
    this.logger.log(
      `[REFUND] Order ${orderId}, refundId ${body.unique_request_id}, amount ${body.amount}`,
    );
    return this.request<HdfcRefundRecord>(
      'POST',
      `/orders/${encodeURIComponent(orderId)}/refunds`,
      body,
    );
  }
}
