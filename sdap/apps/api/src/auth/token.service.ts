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
    // Load keys from ENV or local keys/ directory fallback
    this.privateKey =
      process.env.JWT_PRIVATE_KEY ||
      fs.readFileSync(path.join(process.cwd(), 'keys', 'private.pem'), 'utf8');
    this.publicKey =
      process.env.JWT_PUBLIC_KEY ||
      fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8');
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
