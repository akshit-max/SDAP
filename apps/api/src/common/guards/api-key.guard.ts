import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../../api-keys/api-keys.service';

const API_KEY_PREFIX = 'wk_live_';

/**
 * ApiKeyGuard — validates `Authorization: Bearer wk_live_...` tokens.
 * Used by programmatic endpoints that CI/CD pipelines call.
 *
 * On success, injects `req.apiKeyContext = { organizationId, keyId }`
 * so downstream controllers can scope operations to the right org.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('API key required');
    }

    const rawKey = authHeader.slice(7).trim();
    if (!rawKey.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const result = await this.apiKeysService.validate(rawKey);
    if (!result) {
      throw new UnauthorizedException('Invalid, expired, or revoked API key');
    }

    (req as any).apiKeyContext = result;
    return true;
  }
}
