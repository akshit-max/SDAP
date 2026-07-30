import { Controller, Post, Body, Req, Ip, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterSchema,
  RegisterDto,
  LoginSchema,
  LoginDto,
  RefreshSchema,
  RefreshDto,
  ForgotPasswordSchema,
  ForgotPasswordDto,
  ResetPasswordSchema,
  ResetPasswordDto,
} from '@repo/types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.register(dto, ip, req.headers['user-agent']);
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
      ip,
      req.headers['user-agent'],
    );
  }

  @Post('logout')
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Sends a reset link to the provided email.
   * Rate-limited: 5 requests per minute to prevent abuse.
   * Always returns success — prevents email enumeration.
   */
  @Post('forgot-password')
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
