import { Controller, Post, Body, Req, Ip, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchema, RegisterDto, LoginSchema, LoginDto, RefreshSchema, RefreshDto } from '@repo/types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.refresh(dto.refreshToken, ip, req.headers['user-agent']);
  }

  @Post('logout')
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
