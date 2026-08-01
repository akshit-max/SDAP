import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface JwtPayload {
  sub: string; // userId
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const isProd = process.env.NODE_ENV === 'production';

    // In production, we'd pull from secrets manager. For local dev, read from keys/
    let publicKey = configService.get<string>('JWT_PUBLIC_KEY');

    if (!publicKey) {
      try {
        const rootDir = process.cwd();
        publicKey = readFileSync(join(rootDir, 'keys', 'public.pem'), 'utf-8');
      } catch {
        // Fallback for MVP if keys are not generated/configured
        publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4bgTcNYc5gywm/wm6PF5
OvyWWfXmuEzhbBaY3GRSA2Apd30pntXxb3RRMWKQwD7tm1VZMORlNKZlt1a7V9aO
wGBjxgsN9XLCwKpBlfom2cRAspsRoT/SiCvt4l4eq5YvaS5uhIK75OyeAi/drR5g
Qlhj4A3A7BNqTn8xbTRwyxfCYXDerrsDtDn2fXLdDOEY+90LxuVv1B2dnmvruToB
+AjHqGLpm7YpOeZpMf/fdpD7JWinnU4KhhjV2TeRnVJwgZDzUBUN2Ccj5vrC65Au
B4HLUxZC3a/0OfbkwNoD+noAnn5z4MRuOhWXtiHpxLtOG1P6KQYEKwNdZ4OIOFvg
7wIDAQAB
-----END PUBLIC KEY-----`;
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['sdap_token'];
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey as string,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException();
    }
    // Return the user object attached to request
    return { id: payload.sub, email: payload.email };
  }
}
