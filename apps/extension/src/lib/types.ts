// ─── Auth ────────────────────────────────────────────────────────────────────

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresAt: number; // Unix ms
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface ExtensionSession {
  id: string;
  secretId: string;
  secretName?: string;
  resourceName?: string;
  organizationId: string;
  grantorEmail?: string;
  grantor?: { email: string; fullName: string };
  expiresAt: string;
  revealCount: number;
  maxReveals: number | null;
  status?: string;
}

// ─── Messages (content ↔ service worker) ─────────────────────────────────────

export type MessageType =
  | 'GET_ACTIVE_SESSION'
  | 'REVEAL_SECRET'
  | 'REQUEST_ACCESS'
  | 'CHECK_AUTH'
  | 'LOGOUT'
  | 'LAUNCH_SESSION';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface CredentialFields {
  usernameSelector: string;
  passwordSelector: string;
  /** Optional: click this button after filling */
  submitSelector?: string;
}

export interface ProviderAdapter {
  /** Display name */
  name: string;
  /** Domains this provider handles (matched against location.hostname) */
  domains: string[];
  /** Returns the form field selectors for the login page */
  getCredentialFields(): CredentialFields | null;
  /** Optional hook called after fill (e.g. to dismiss cookie banners) */
  afterFill?(): void;
}

// ─── Autofill Payload ────────────────────────────────────────────────────────

export interface AutofillPayload {
  username: string;
  password: string;
}

// ─── V2 Platform Configuration ───────────────────────────────────────────────

export interface PlatformConfig {
  id: string;
  name: string;
  domains: string[];
  login: {
    url: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector?: string;
  };
  otp?: {
    type: 'EMAIL' | 'SMS' | 'NONE';
    inputSelector: string;
    submitSelector?: string;
  };
  // Future extensibility as per architectural requirements
  principalType?: string;
  supportsDelegation?: boolean;
}
