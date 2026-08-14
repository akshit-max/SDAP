import { ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Ensure a CSRF token exists for this session
  let csrfCookie = req.cookies['sdap_csrf'];
  if (!csrfCookie) {
    csrfCookie = crypto.randomBytes(32).toString('hex');
    // Non-httpOnly so the frontend JS can read it to send it back as a header
    res.cookie('sdap_csrf', csrfCookie, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
  }

  // 2. Skip verification for safe methods, auth endpoints, or extension requests with Bearer auth.
  //
  // Extension CSRF bypass requires a Bearer Authorization header to be present.
  // Bearer token auth is inherently CSRF-resistant — the browser cannot auto-inject it
  // on cross-site requests the way it can inject cookies. A malicious page sending only
  // the X-Extension-Client header (without a Bearer token) still hits CSRF verification.
  //
  // /auth/logout and /auth/refresh are excluded alongside login/register because they are
  // part of the auth flow; the extension calls them without a Bearer token.
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isExtensionWithBearer =
    req.header('X-Extension-Client') === 'withus-mv3' && !!req.header('Authorization');
  const isAuthEndpoint =
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/logout') ||
    req.path.includes('/auth/refresh') ||
    req.path.includes('/auth/register') ||
    req.path.includes('/auth/forgot-password') ||
    req.path.includes('/auth/reset-password');

  if (safeMethods.includes(req.method) || isExtensionWithBearer || isAuthEndpoint) {
    return next();
  }

  // 3. Verify the CSRF token on state-changing methods
  const csrfHeader = req.header('X-CSRF-Token');
  if (!csrfHeader) {
    throw new ForbiddenException('CSRF token missing');
  }

  // Use constant-time comparison to prevent timing attacks
  try {
    const cookieBuffer = Buffer.from(csrfCookie, 'utf8');
    const headerBuffer = Buffer.from(csrfHeader, 'utf8');
    
    if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
      throw new Error();
    }
  } catch {
    throw new ForbiddenException('Invalid CSRF token');
  }

  next();
}
