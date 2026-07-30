import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

/**
 * UsersController — /api/v1/users
 *
 * All endpoints require JWT authentication.
 * Exposes the authenticated user's own profile — no admin routes here.
 *
 * Architectural note:
 *   /me routes always operate on req.user.id (from JWT).
 *   Never expose routes that allow modifying another user's profile
 *   without an explicit admin guard — that belongs in an AdminModule.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) return null;
    // Never expose passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  @Patch('me')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/change-password')
  async changePassword(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
