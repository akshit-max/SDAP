import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { HdfcReturnUrlParams } from './hdfc-types';

/**
 * HdfcSignatureService
 *
 * Handles two distinct HDFC security verification mechanisms:
 *
 * 1. Return URL HMAC verification
 *    - Uses HDFC_RESPONSE_KEY (configured in HDFC Dashboard → Settings → Response Key)
 *    - NOT the API Key
 *    - Algorithm: percent-encode all params (except signature/signature_algorithm),
 *      sort alphabetically, join as key=value&..., percent-encode the whole string,
 *      then HMAC with the Response Key using the algorithm specified in signature_algorithm.
 *
 * 2. Webhook Basic Auth verification
 *    - Uses HDFC_WEBHOOK_USERNAME and HDFC_WEBHOOK_PASSWORD
 *    - Configured in HDFC Dashboard → Settings → Webhook Tab
 *    - NOT the API Key or Response Key
 */
@Injectable()
export class HdfcSignatureService {
  private readonly logger = new Logger(HdfcSignatureService.name);
  private readonly responseKey: string;
  private readonly webhookUsername: string;
  private readonly webhookPassword: string;

  constructor(private readonly config: ConfigService) {
    this.responseKey = this.config.getOrThrow<string>('HDFC_RESPONSE_KEY');
    this.webhookUsername = this.config.getOrThrow<string>(
      'HDFC_WEBHOOK_USERNAME',
    );
    this.webhookPassword = this.config.getOrThrow<string>(
      'HDFC_WEBHOOK_PASSWORD',
    );
  }

  /**
   * Verify the HMAC signature on the HDFC return URL.
   *
   * Per HDFC documentation:
   * 1. Extract all query params except 'signature' and 'signature_algorithm'
   * 2. Percent-encode each key and value
   * 3. Sort alphabetically by encoded key (ASCII sort)
   * 4. Build: encodedKey=encodedValue&encodedKey=encodedValue...
   * 5. Percent-encode the entire resulting string
   * 6. HMAC using signature_algorithm (from params) and HDFC_RESPONSE_KEY
   * 7. Percent-encode the resulting hash
   * 8. Compare with percent-decoded signature param
   *
   * Returns true if valid, false if invalid or missing signature.
   * Logs a warning (not an error) on mismatch to avoid leaking info.
   */
  verifyReturnUrl(params: HdfcReturnUrlParams): boolean {
    const { signature, signature_algorithm, ...rest } = params;

    if (!signature || !signature_algorithm) {
      this.logger.warn(
        '[HMAC] Return URL missing signature or signature_algorithm',
      );
      return false;
    }

    try {
      // Step 1-2: Percent-encode all remaining key=value pairs
      const encoded = Object.entries(rest)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [
          encodeURIComponent(k),
          encodeURIComponent(v as string),
        ]);

      // Step 3: Sort alphabetically by encoded key (ASCII sort)
      encoded.sort(([a = ''], [b = '']) => (a < b ? -1 : a > b ? 1 : 0));

      // Step 4: Build key=value&... string
      const paramString = encoded.map(([k, v]) => `${k}=${v}`).join('&');

      // Step 5: Percent-encode the entire string
      const encodedParamString = encodeURIComponent(paramString);

      // Step 6: HMAC using the algorithm from the return URL params
      const algorithm = signature_algorithm.toLowerCase(); // e.g. "hmacsha256"
      const hmacAlgo = this.normalizeAlgorithm(algorithm);
      const computedHash = crypto
        .createHmac(hmacAlgo, this.responseKey)
        .update(encodedParamString)
        .digest('hex');

      // Step 7-8: Percent-encode hash, compare with decoded signature
      const computedEncoded = encodeURIComponent(computedHash);
      const receivedDecoded = decodeURIComponent(signature);

      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedEncoded),
        Buffer.from(receivedDecoded),
      );

      if (!isValid) {
        this.logger.warn('[HMAC] Return URL signature mismatch');
      }

      return isValid;
    } catch (err: unknown) {
      this.logger.error(
        '[HMAC] Return URL verification threw:',
        (err as Error).message,
      );
      return false;
    }
  }

  /**
   * Verify incoming webhook Basic Auth header.
   * HDFC sends: Authorization: Basic base64(username:password)
   * We compare against HDFC_WEBHOOK_USERNAME and HDFC_WEBHOOK_PASSWORD.
   */
  verifyWebhookAuth(authorizationHeader: string | undefined): void {
    if (!authorizationHeader?.startsWith('Basic ')) {
      throw new UnauthorizedException(
        'Missing or invalid webhook Authorization header',
      );
    }

    let decoded: string;
    try {
      decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString(
        'utf-8',
      );
    } catch {
      throw new UnauthorizedException('Malformed webhook Authorization header');
    }

    const colonIndex = decoded.indexOf(':');
    if (colonIndex < 0) {
      throw new UnauthorizedException('Malformed webhook credentials');
    }

    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    const expectedUser = Buffer.from(this.webhookUsername);
    const expectedPass = Buffer.from(this.webhookPassword);
    const receivedUser = Buffer.from(username);
    const receivedPass = Buffer.from(password);

    // Constant-time comparison — prevent timing attacks
    const userMatch =
      receivedUser.length === expectedUser.length &&
      crypto.timingSafeEqual(receivedUser, expectedUser);
    const passMatch =
      receivedPass.length === expectedPass.length &&
      crypto.timingSafeEqual(receivedPass, expectedPass);

    if (!userMatch || !passMatch) {
      this.logger.warn('[WEBHOOK] Authorization failed — credential mismatch');
      throw new UnauthorizedException('Webhook authentication failed');
    }
  }

  /** Normalize HDFC algorithm names to Node.js crypto names */
  private normalizeAlgorithm(algorithm: string): string {
    switch (algorithm.toLowerCase().replace(/[-_\s]/g, '')) {
      case 'hmacsha256':
        return 'sha256';
      case 'hmacsha512':
        return 'sha512';
      case 'hmacsha1':
        return 'sha1';
      default:
        this.logger.warn(
          `[HMAC] Unknown algorithm ${algorithm}, defaulting to sha256`,
        );
        return 'sha256';
    }
  }
}
