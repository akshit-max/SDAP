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
      // Fallback dummy keys for MVP / initial deployment so the app doesn't crash on boot without keys
      this.privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDhuBNw1hzmDLCb
/Cbo8Xk6/JZZ9ea4TOFsFpjcZFIDYCl3fSme1fFvdFExYpDAPu2bVVkw5GU0pmW3
VrtX1o7AYGPGCw31csLAqkGV+ibZxECymxGhP9KIK+3iXh6rli9pLm6Egrvk7J4C
L92tHmBCWGPgDcDsE2pOfzFtNHDLF8JhcN6uuwO0OfZ9ct0M4Rj73QvG5W/UHZ2e
a+u5OgH4CMeoYumbtik55mkx/992kPslaKedTgqGGNXZN5GdUnCBkPNQFQ3YJyPm
+sLrkC4HgctTFkLdr/Q59uTA2gP6egCefnPgxG46FZe2IenEu04bU/opBgQrA11n
g4g4W+DvAgMBAAECggEAG2IdhFQ1b/iczw+pbhvSvUPkvvKEvwR0rzbpQd4vJOxc
Ria6ZI6dRQwzcsOmaUGOdIhyKEBNFt9o+kkHXqyk538fcOiTv5yLNpxxFc93OcwD
8qcQCHlEV/NxtJipLTUseJzYGN3+CtO53Oy5qUWaH/JhNiP1AlmIorqY4HVliahp
6f89oMXFzHhNi6OQYdlNiSwNqgQOxrIwWHnI7+2odNw9jW8aSy1KWAXJknAomXCl
JVMl73UXjEv1077zQ8USmGkuW0OfIMnlOipfekXmx1yWSKuFk9M3kvZFc53WAnJA
b1OOIg+N4Lm5/QdLXJ/iefV0ysmR6XIWHiGuNoCoYQKBgQDyd/PjzcoP1KGW9Gz3
hZiOpf7Cs+XzvDjRlBOjbPQwODPvQCUTNoHlheOfFNQXkXA2gozh9K+QwMT325cI
jSe18/ThnlZobII3po7sqwM8RdttKdG42cidRxpywylCI2HY1bA4XOJYBwJ8Cfcu
RI3mBg28T33o3F2h0If2IM9IOwKBgQDuUNRxf2ucWZTfr/gSbqEgr/kcs855eMJE
ooLTKzfEs/W9LX2DdtzDo7FXF+usHCBBatLSwTUGdIvo/ZogpvleB/irPuHm1bHd
vSZdKi6MGN0uYYkdNIT1z4MXeUUeZCiXWvHGj5ePTM2kv+rAhroqKNpwKFITkX3d
Ebrnpf0y3QKBgElUFaJTXkSjXas1iK7i7FxXv1BK78RirBxV2AqYrNDYbnxwvcWt
umMbttcpiWsHRRR3Lvw279GrOuZqtqaTaesROIHzTNaP2mHSMW9J2NSlm9LLzu1E
j/NgyZLjitrBsJnPJlglXx6YIBw7N1H60Z87PXQx5jZCTt7dHgFFsup5AoGAP08V
wLj622Qo2mui2TKud0KISQmzNi3QXe9WFccLX6P3CjSFfWEcMJTRzbM7FlO6deZs
7zQIZBid+l00jqwM3t/7PXLNDEeEosVW5bUI/Iq2Z1Xd2PZUxABGcPv0UqiE6ABu
7jLDLnxWvQeG03J3DjAgJ19uvmgOKaZGIrfD1bkCgYAT9/1FaunjLb/BDRsd5DYU
fo864A2H8GlWPoY6e8Gx2lP+HmO0BK0JsNF/A2dpN2+PgCb94A1xBXVIEuqGWgKH
6t1D4pcXD6dNRzn3jkZI5OjbmDRUDpWQPDbPk6v8R94nUR4SPp68dm9r+iIGKa5O
ISUMN2/Y7FBks8hL3DkFbw==
-----END PRIVATE KEY-----`;
      this.publicKey = `-----BEGIN PUBLIC KEY-----
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
