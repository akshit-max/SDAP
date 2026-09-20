/**
 * HDFC SmartGateway — TypeScript Type Definitions
 *
 * All API request/response shapes for HdfcGatewayService.
 * Verified against HDFC SmartGateway API documentation (Basic Auth).
 */

// ─── Session API ─────────────────────────────────────────────────────────────

export interface HdfcSessionRequest {
  order_id: string; // Max 21 chars, alphanumeric
  amount: string; // Decimal string e.g. "499.00"
  customer_id: string;
  customer_email: string;
  customer_phone: string; // 10 digits, no country code
  payment_page_client_id: string; // UAT: "hdfcmaster" | Prod: merchant_id
  action: 'paymentPage';
  currency: string; // "INR"
  return_url: string; // Must be HTTPS
  description?: string;
  first_name?: string;
  last_name?: string;
  // Mandate registration (required for recurring billing)
  options?: {
    create_mandate: 'REQUIRED' | 'OPTIONAL';
  };
  mandate?: {
    max_amount: string; // Upper bound for all executions e.g. "5000"
    frequency: 'MONTH' | 'YEAR';
    mandate_id: string; // Our generated unique ID (max 21 chars)
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
  };
}

export interface HdfcSessionResponse {
  status: string; // e.g. "NEW"
  payment_links?: {
    web: string;
  };
  order_id: string;
  id?: string;
}

// ─── Order Status API ─────────────────────────────────────────────────────────

export type HdfcOrderStatus =
  | 'CHARGED' // Terminal — payment successful
  | 'FAILED' // Terminal — payment failed
  | 'CANCELLED' // Terminal — user cancelled
  | 'EXPIRED' // Terminal — session expired
  | 'NEW' // Non-terminal — no attempt yet
  | 'PENDING_VBV'; // Non-terminal — 3DS auth in progress

export interface HdfcOrderStatusResponse {
  order_id: string;
  status: HdfcOrderStatus;
  status_id: number;
  amount: number;
  currency: string;
  customer_id: string;
  txn_id?: string;
  txn_uuid?: string;
  payment_method?: string;
  bank_error_code?: string;
  bank_error_message?: string;
  refunded?: boolean;
  amount_refunded?: number;
  refunds?: HdfcRefundRecord[];
}

// ─── Refund API ───────────────────────────────────────────────────────────────

export interface HdfcRefundRequest {
  unique_request_id: string; // Max 21 chars, must not be reused
  amount: number;
}

export interface HdfcRefundRecord {
  id: string;
  amount: number;
  unique_request_id: string;
  ref: string;
  created: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  error_message?: string;
}

// ─── Mandate Execution API ────────────────────────────────────────────────────

export interface HdfcMandateExecuteRequest {
  order_id: string; // New unique order ID per execution (max 21 chars)
  amount: string; // Must not exceed mandate.max_amount
  currency: string;
  customer_id: string;
}

export interface HdfcMandateExecuteResponse {
  status: string;
  order_id: string;
  txn_id?: string;
  mandate_id?: string;
}

// ─── Mandate Status ───────────────────────────────────────────────────────────

export type HdfcMandateStatus =
  'CREATED' | 'ACTIVE' | 'PAUSED' | 'REVOKED' | 'EXPIRED' | 'FAILED';

export interface HdfcMandateStatusResponse {
  mandate_id: string;
  status: HdfcMandateStatus;
  max_amount: string;
  frequency: string;
  start_date: string;
  end_date: string;
}

// ─── Mandate Revoke ───────────────────────────────────────────────────────────

export interface HdfcMandateRevokeResponse {
  status: string;
  mandate_id: string;
}

// ─── Return URL Parameters ────────────────────────────────────────────────────

export interface HdfcReturnUrlParams {
  order_id: string;
  status?: string;
  signature?: string;
  signature_algorithm?: string;
  [key: string]: string | undefined;
}

// ─── Webhook Payload ──────────────────────────────────────────────────────────

export interface HdfcWebhookPayload {
  id: string; // Event ID e.g. "evt_gsu1c0r7umcfrxeb"
  event_name: string; // e.g. "ORDER_SUCCEEDED"
  date_created: string; // ISO 8601
  content: {
    order: HdfcOrderStatusResponse;
  };
}

// ─── Relevant webhook event names ─────────────────────────────────────────────

export const HDFC_WEBHOOK_EVENTS = {
  ORDER_SUCCEEDED: 'ORDER_SUCCEEDED',
  ORDER_FAILED: 'ORDER_FAILED',
  REFUND_INITIATED: 'REFUND_INITIATED',
  REFUND_SUCCEEDED: 'REFUND_SUCCEEDED',
  MANDATE_REGISTERED: 'MANDATE_REGISTERED',
  MANDATE_REVOKED: 'MANDATE_REVOKED',
} as const;
