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
  capabilities?: string[];
  mcaRestrictedModules?: string[];
}

// ─── Messages (content ↔ service worker) ─────────────────────────────────────

export type MessageType =
  | 'GET_ACTIVE_SESSION'
  | 'REVEAL_SECRET'
  | 'REQUEST_ACCESS'
  | 'CHECK_AUTH'
  | 'LOGOUT'
  | 'LAUNCH_SESSION'
  | 'FETCH_OTP';

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

export interface CapabilityRestriction {
  allowedRoutePatterns?: string[];
  restrictedRoutePatterns?: string[];
  hideElementsCSS?: string[];
}

export interface PlatformConfig {
  id: string;
  name: string;
  domains: string[];
  login: {
    url: string;
    usernameSelector: string;
    /**
     * Optional for platforms that don't use a separate password field
     * (e.g. Udyam: Registration Number → OTP only, no password).
     * All standard username+password platforms provide this.
     */
    passwordSelector?: string;
    submitSelector?: string;
    requirePasswordOnDOM?: boolean;
  };
  otp?: {
    type: 'EMAIL' | 'SMS' | 'NONE';
    inputSelector: string;
    submitSelector?: string;
  };
  /**
   * Array of CSS selectors to forcefully hide from the UI (e.g., 'Show Password' buttons).
   * Injected globally into document.head to survive React re-renders.
   */
  hideElementsCSS?: string[];
  /**
   * Optional map of capability restrictions for module-level access.
   */
  capabilityRestrictions?: Record<string, CapabilityRestriction>;
  /**
   * When set, the autofill engine fills credentials then pauses — it does NOT
   * auto-submit. Instead it shows this message as a toast so the user can
   * complete any remaining manual step (CAPTCHA, SMS OTP, passkey, etc.).
   *
   * Generic by design. Never add platform-specific logic here.
   * Examples: MCA CAPTCHA, GST CAPTCHA, Udyam SMS OTP.
   */
  manualStepMessage?: string;
  // Future extensibility as per architectural requirements
  principalType?: string;
  supportsDelegation?: boolean;
}
