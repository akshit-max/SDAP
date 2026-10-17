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

export const HDFC_ORDER_STATUS_TIMEOUT_MS = 15_000;

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
    isFormEncoded = false,
    timeoutMs?: number,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const requestHeaders = { ...this.headers };
    let requestBody: string | undefined = undefined;

    if (body) {
      if (isFormEncoded) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = new URLSearchParams(
          body as Record<string, string>,
        ).toString();
      } else {
        requestBody = JSON.stringify(body);
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'TimeoutError') {
        // Plain Error (not HttpException) so the global filter logs it
        throw new Error(
          `HDFC API ${method} ${path} timed out after ${timeoutMs}ms`,
        );
      }
      throw err;
    }

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
    const res = await this.request<any>('POST', '/session', body);
    this.logger.log(
      `[SESSION] Session created for order ${body.order_id}, status: ${res?.status ?? 'UNKNOWN'}`,
    );
    return res as HdfcSessionResponse;
  }

  async getOrderStatus(orderId: string): Promise<HdfcOrderStatusResponse> {
    this.logger.log(`[ORDER STATUS] Fetching order ${orderId}`);
    // Read-only, so safe to time out: the return URL redirect and the
    // reconciliation sweep must not hang on a stalled HDFC connection.
    // Charge/revoke/refund calls are deliberately NOT timed out — a client-side
    // timeout there cannot tell us whether HDFC acted (see processRenewal).
    return this.request<HdfcOrderStatusResponse>(
      'GET',
      `/orders/${encodeURIComponent(orderId)}`,
      undefined,
      false,
      HDFC_ORDER_STATUS_TIMEOUT_MS,
    );
  }

  async executeMandateCharge(
    mandateId: string,
    body: HdfcMandateExecuteRequest,
  ): Promise<HdfcMandateExecuteResponse> {
    this.logger.log(
      `[MANDATE EXECUTE] Mandate ${mandateId}, order ${body.order_id}, amount ${body.amount}`,
    );
    const formBody = {
      'order.order_id': body.order_id,
      'order.amount': body.amount,
      'order.currency': body.currency,
      'customer.id': body.customer_id,
      mandate_id: mandateId,
    };
    return this.request<HdfcMandateExecuteResponse>(
      'POST',
      `/txns`,
      formBody,
      true,
    );
  }

  async getMandateStatus(
    mandateId: string,
  ): Promise<HdfcMandateStatusResponse> {
    this.logger.log(`[MANDATE STATUS] Checking ${mandateId}`);
    return this.request<HdfcMandateStatusResponse>(
      'POST',
      `/mandates/${encodeURIComponent(mandateId)}`,
      { command: 'check_status' },
      true,
    );
  }

  async revokeMandate(mandateId: string): Promise<HdfcMandateRevokeResponse> {
    this.logger.log(`[MANDATE REVOKE] Revoking ${mandateId}`);
    return this.request<HdfcMandateRevokeResponse>(
      'POST',
      `/mandates/${encodeURIComponent(mandateId)}`,
      { command: 'revoke' },
      true,
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
