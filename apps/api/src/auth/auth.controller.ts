import { Controller, Post, Body, Req, Res, Ip, UsePipes, UnauthorizedException, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
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
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    
    res.cookie('sdap_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour — matches AUTH_CONFIG.accessTTL
    });

    res.cookie('sdap_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth/refresh', // only sent to refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    
    res.clearCookie('sdap_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    
    res.clearCookie('sdap_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and organization' })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response, @Ip() ip: string) {
    const result = await this.authService.register(dto, ip, req.headers['user-agent']);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and obtain tokens' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response, @Ip() ip: string) {
    const result = await this.authService.login(dto, ip, req.headers['user-agent']);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
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
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
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
}
