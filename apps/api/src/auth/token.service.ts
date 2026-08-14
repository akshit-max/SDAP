import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_CONFIG } from '@repo/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TokenService {
  private privateKey: string;
  private publicKey: string;

  constructor(private jwtService: JwtService) {
    try {
      this.privateKey =
        process.env.JWT_PRIVATE_KEY ||
        fs.readFileSync(path.join(process.cwd(), 'keys', 'private.pem'), 'utf8');
      this.publicKey =
        process.env.JWT_PUBLIC_KEY ||
        fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8');
    } catch (e) {
      // No hardcoded fallback — the application must not start without valid JWT keys.
      // Set JWT_PRIVATE_KEY / JWT_PUBLIC_KEY env vars (production) or generate keys/private.pem
      // and keys/public.pem (local dev) before starting the server.
      throw new Error(
        'JWT keys are not configured. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables, ' +
        'or generate keys/private.pem and keys/public.pem for local development. ' +
        `Original error: ${(e as Error).message}`,
      );
    }
  }

  generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.privateKey,
        expiresIn: AUTH_CONFIG.accessTTL,
        algorithm: 'RS256',
        issuer: AUTH_CONFIG.issuer,
        audience: AUTH_CONFIG.audience,
      },
    );
  }

  verifyAccessToken(token: string): any {
    return this.jwtService.verify(token, {
      secret: this.publicKey,
      algorithms: ['RS256'],
      issuer: AUTH_CONFIG.issuer,
      audience: AUTH_CONFIG.audience,
      clockTolerance: AUTH_CONFIG.clockTolerance,
    });
  }
}
