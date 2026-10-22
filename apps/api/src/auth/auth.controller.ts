import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Ip,
  UsePipes,
  UnauthorizedException,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService, GoogleOAuthError } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import * as crypto from 'crypto';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@repo/types';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('sdap_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour — matches AUTH_CONFIG.accessTTL
    });

    res.cookie('sdap_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/v1/auth/refresh', // only sent to refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('sdap_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('sdap_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/v1/auth/refresh',
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and organization' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const result = await this.authService.register(
      dto,
      ip,
      req.headers['user-agent'],
    );
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and obtain tokens' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const result = await this.authService.login(
      dto,
      ip,
      req.headers['user-agent'],
    );
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const token = dto.refreshToken || req.cookies['sdap_refresh_token'];
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const result = await this.authService.refresh(
      token,
      ip,
      req.headers['user-agent'],
    );
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token and log out' })
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || req.cookies['sdap_refresh_token'];
    if (token) {
      await this.authService.logout(token);
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Sends a reset link to the provided email.
   * Rate-limited: 5 requests per minute to prevent abuse.
   * Always returns success — prevents email enumeration.
   */
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Consumes a reset token and sets a new password.
   * Token expires in 15 minutes and can only be used once.
   */
  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('invites/:token')
  @ApiOperation({ summary: 'Get invitation details without authentication' })
  async getInvitationDetails(@Param('token') token: string) {
    const result = await this.authService.getInvitationDetails(token);
    return { success: true, data: result };
  }

  /**
   * GET /api/v1/auth/session-status
   * Lightweight polling endpoint to detect session displacement in real-time.
   * Reads the sdap_token (access token) cookie, decodes userId + iat, then checks
   * if a newer active refresh token exists for that user — indicating a new login
   * on another device has displaced this session.
   *
   * Returns: { displaced: false } | { displaced: true }
   * No authentication guard needed — we read the cookie ourselves.
   */
  @Get('session-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if the current session has been displaced by a new login',
  })
  async sessionStatus(@Req() req: Request) {
    const token = (req as any).cookies?.['sdap_token'];
    if (!token) {
      return { displaced: false };
    }
    return this.authService.checkSessionStatus(token);
  }

  /**
   * GET /api/v1/auth/google
   * Redirects the browser to Google's consent screen. A random CSRF nonce is
   * embedded in `state` and bound to this browser via a short-lived httpOnly cookie.
   */
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  googleAuth(@Query('redirect') redirect: string, @Res() res: Response) {
    try {
      const { url, csrf } = this.authService.buildGoogleAuthUrl(redirect);
      res.cookie(GOOGLE_STATE_COOKIE, csrf, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // must survive the top-level redirect back from Google
        path: GOOGLE_STATE_COOKIE_PATH,
        maxAge: 10 * 60 * 1000, // 10 minutes
      });
      return res.redirect(url);
    } catch (err: unknown) {
      return res.redirect(`/login?error=${googleErrorCode(err)}`);
    }
  }

  /**
   * GET /api/v1/auth/google/callback
   * Verifies state against the CSRF cookie, exchanges the code, issues the same
   * session cookies as /login, then hands off to the frontend callback page.
   * Only error codes (never raw messages or profile data) are put in URLs.
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
  ) {
    const expectedCsrf: string | undefined = (req as any).cookies?.[
      GOOGLE_STATE_COOKIE
    ];
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: GOOGLE_STATE_COOKIE_PATH });

    if (error) {
      const reason =
        error === 'access_denied' ? 'google_cancelled' : 'google_failed';
      return res.redirect(`/login?error=${reason}`);
    }

    const parsedState = AuthService.parseGoogleState(state);
    if (
      !code ||
      !parsedState ||
      !expectedCsrf ||
      !safeEqual(parsedState.csrf, expectedCsrf)
    ) {
      return res.redirect('/login?error=google_state_mismatch');
    }

    try {
      const result = await this.authService.handleGoogleAuth(
        code,
        parsedState.redirect,
        ip,
        req.headers['user-agent'],
      );
      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      const params = new URLSearchParams({ redirect: result.redirect });
      if (result.isNewUser) params.set('new', '1');
      return res.redirect(`/auth/callback/google?${params.toString()}`);
    } catch (err: unknown) {
      if (!(err instanceof GoogleOAuthError)) {
        this.logger.error('Google OAuth callback failed', err as Error);
      }
      // Keep the original destination (e.g. an invite link) so the user can retry.
      const params = new URLSearchParams({ error: googleErrorCode(err) });
      if (parsedState.redirect !== '/dashboard') {
        params.set('redirect', parsedState.redirect);
      }
      return res.redirect(`/login?${params.toString()}`);
    }
  }

  /**
   * GET /api/v1/auth/session
   * Returns { user, organization } in the same shape as POST /login for the
   * cookie-authenticated user. Used by the Google callback page.
   */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current session user and organization' })
  async session(@Req() req: Request) {
    return this.authService.getSessionContext((req as any).user.id);
  }
}

const GOOGLE_STATE_COOKIE = 'sdap_oauth_state';
const GOOGLE_STATE_COOKIE_PATH = '/api/v1/auth/google';

function googleErrorCode(err: unknown): string {
  return err instanceof GoogleOAuthError ? err.code : 'google_failed';
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
