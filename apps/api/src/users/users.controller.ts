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
import { ApiTags, ApiOperation, ApiProperty, ApiPropertyOptional, ApiBearerAuth } from '@nestjs/swagger';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  githubUsername: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'The user full name', minLength: 2, maxLength: 100 })
  fullName?: string;

  @ApiPropertyOptional({ example: 'octocat', description: 'GitHub username for integration' })
  githubUsername?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'old_password123', description: 'Current password' })
  currentPassword!: string;

  @ApiProperty({ example: 'new_password123', description: 'New password (min 8 chars)', minLength: 8 })
  newPassword!: string;
}

/**
 * UsersController — /api/v1/users
 *
 * All endpoints require JWT authentication.
 * Exposes the authenticated user's own profile — no admin routes here.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change user password' })
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
