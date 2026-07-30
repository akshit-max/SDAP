import { Controller, Post, Body, Req, Ip, UsePipes } from '@nestjs/common';
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
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and organization' })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.register(dto, ip, req.headers['user-agent']);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and obtain tokens' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
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
  @ApiOperation({ summary: 'Revoke a refresh token and log out' })
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
}
