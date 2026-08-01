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
      sameSite: 'lax',
      path: '/',
    });
  }

  // 2. Skip verification for safe methods or browser extension
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method) || req.header('X-Extension-Client') === 'withus-mv3') {
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
