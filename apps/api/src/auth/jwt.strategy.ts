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

    if (!publicKey && !isProd) {
      try {
        const rootDir = process.cwd();
        publicKey = readFileSync(join(rootDir, 'keys', 'public.pem'), 'utf-8');
      } catch {
        throw new Error('Public key not found for JwtStrategy initialization');
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
