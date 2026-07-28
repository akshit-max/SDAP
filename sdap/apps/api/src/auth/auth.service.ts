import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { HashService } from '@repo/security';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from '@repo/types';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const passwordHash = await HashService.hash(dto.password);
    const _user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    // Future: emit UserRegisteredEvent
    return { success: true, message: 'User registered successfully' };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await HashService.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const { refreshToken, rawToken } = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken.hash,
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
      },
    });

    // Future: emit UserLoggedInEvent
    return { accessToken, refreshToken: rawToken };
  }

  async refresh(oldRawToken: string, ipAddress?: string, userAgent?: string) {
    const oldHash = crypto
      .createHash('sha256')
      .update(oldRawToken)
      .digest('hex');
    const oldTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
      include: { user: true },
    });

    if (!oldTokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (oldTokenRecord.isRevoked) {
      this.logger.warn(
        `Refresh token reuse detected for user ${oldTokenRecord.userId} in family ${oldTokenRecord.familyId}`,
      );
      // Replay attack! Revoke entire family
      await this.prisma.refreshToken.updateMany({
        where: { familyId: oldTokenRecord.familyId },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Session compromised. Please login again.',
      );
    }

    if (
      new Date() > oldTokenRecord.expiresAt ||
      !oldTokenRecord.user.isActive
    ) {
      throw new UnauthorizedException('Session expired');
    }

    // Valid - rotate
    const { refreshToken: newRt, rawToken } = this.generateRefreshToken();

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: oldTokenRecord.id },
        data: {
          isRevoked: true,
          lastUsedAt: new Date(),
          replacedByTokenId: newRt.hash,
        }, // Replaced by token hash as reference for now
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: oldTokenRecord.userId,
          tokenHash: newRt.hash,
          familyId: oldTokenRecord.familyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress,
          userAgent,
        },
      }),
    ]);

    const accessToken = this.tokenService.generateAccessToken(
      oldTokenRecord.user.id,
      oldTokenRecord.user.email,
    );
    return { accessToken, refreshToken: rawToken };
  }

  async logout(rawToken: string) {
    const oldHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: oldHash },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    return { success: true };
  }

  private generateRefreshToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { refreshToken: { hash }, rawToken };
  }
}
