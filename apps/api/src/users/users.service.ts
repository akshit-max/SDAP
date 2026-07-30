import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@repo/db';
import { HashService } from '@repo/security';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Update profile fields.
   * Currently supports: fullName only.
   * Email change is a separate flow (requires verification) — out of scope for B-2.
   */
  async updateProfile(userId: string, dto: { fullName: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName.trim() },
      select: { id: true, email: true, fullName: true, createdAt: true },
    });
  }

  /**
   * Change password: verify current password, hash new one,
   * revoke all active refresh tokens (forces re-login on all devices).
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const isValid = await HashService.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await HashService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Revoke all sessions — force re-login everywhere
      this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
