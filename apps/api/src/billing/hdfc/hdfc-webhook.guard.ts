import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { HdfcSignatureService } from './hdfc-signature.service';

/**
 * HdfcWebhookGuard
 *
 * NestJS guard applied to POST /billing/webhook.
 * Validates the HDFC Basic Auth header using credentials configured in
 * HDFC Dashboard → Settings → Webhook Tab.
 *
 * Authentication: username/password (NOT the API Key, NOT HMAC).
 * Throws UnauthorizedException if credentials are missing or wrong.
 * Returns HTTP 200 on success — HDFC retries until it receives 200.
 */
@Injectable()
export class HdfcWebhookGuard implements CanActivate {
  private readonly logger = new Logger(HdfcWebhookGuard.name);

  constructor(private readonly signatureService: HdfcSignatureService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    // Throws UnauthorizedException on failure — NestJS maps to 401 response
    this.signatureService.verifyWebhookAuth(authHeader);

    this.logger.debug('[WEBHOOK] Authorization verified');
    return true;
  }
}
