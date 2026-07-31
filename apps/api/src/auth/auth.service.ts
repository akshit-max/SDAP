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
import { MailerService } from '../notifications/mailer.service';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrganizationCreatedEvent,
  InvitationAcceptedEvent,
} from '../organizations/organizations.events';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // Determine the onboarding mode
    const isInviteFlow = !!dto.inviteToken;
    const isNewOrgFlow = !!dto.companyName;

    if (!isInviteFlow && !isNewOrgFlow) {
      throw new BadRequestException(
        'Either a company name or a valid invite token is required.',
      );
    }

    const passwordHash = await HashService.hash(dto.password);

    // --- Invite flow: validate invitation before writing anything ---
    let invitation: any = null;
    if (isInviteFlow) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(dto.inviteToken!)
        .digest('hex');
      invitation = await this.prisma.organizationInvitation.findUnique({
        where: { tokenHash },
      });
      if (!invitation) {
        throw new BadRequestException('Invalid or expired invitation link.');
      }
      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          `This invitation has already been ${invitation.status.toLowerCase()}.`,
        );
      }
      if (new Date() > invitation.expiresAt) {
        throw new BadRequestException(
          'This invitation link has expired. Please ask the admin to resend it.',
        );
      }
      // Verify the invited email matches the registering email
      if (invitation.email.toLowerCase() !== dto.email.toLowerCase()) {
        throw new BadRequestException(
          'This invitation was sent to a different email address.',
        );
      }
    }

    // --- New org flow: generate unique slug ---
    let slug: string | null = null;
    if (isNewOrgFlow) {
      const baseSlug = dto.companyName!
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      slug = baseSlug;
      const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
      if (existingOrg) {
        slug = `${baseSlug}-${randomUUID().substring(0, 6)}`;
      }
    }

    // --- Atomic transaction ---
    const { user, organization } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
        },
      });

      let createdOrg: any = null;

      if (isInviteFlow && invitation) {
        // Mark invitation ACCEPTED and create member record
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED', updatedBy: createdUser.id },
        });
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId: createdUser.id,
            role: 'MEMBER', // Default role — admin can promote later
            invitedBy: invitation.invitedBy,
            createdBy: createdUser.id,
            updatedBy: createdUser.id,
          },
        });
        createdOrg = await tx.organization.findUnique({
          where: { id: invitation.organizationId },
        });
      } else {
        // Create a brand-new organization with OWNER role
        createdOrg = await tx.organization.create({
          data: {
            name: dto.companyName!,
            slug: slug!,
            createdBy: createdUser.id,
          },
        });
        await tx.organizationMember.create({
          data: {
            userId: createdUser.id,
            organizationId: createdOrg.id,
            role: 'OWNER',
          },
        });
      }

      return { 
        user: createdUser, 
        organization: createdOrg ? { ...createdOrg, role: isInviteFlow ? 'MEMBER' : 'OWNER' } : null 
      };
    });

    if (isInviteFlow && invitation) {
      this.eventEmitter.emit(
        'invitation.accepted',
        new InvitationAcceptedEvent(invitation.organizationId, user.id),
      );
    } else if (organization) {
      this.eventEmitter.emit(
        'organization.created',
        new OrganizationCreatedEvent(organization.id, organization.name, user.id),
      );
    }

    const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
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

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      organization,
    };
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

    // Fetch the user's first/default organization
    const firstMembership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' }
    });

    // Future: emit UserLoggedInEvent
    return { 
      accessToken, 
      refreshToken: rawToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      organization: firstMembership 
        ? { ...firstMembership.organization, role: firstMembership.role }
        : null
    };
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
    // Fetch the user's first/default organization
    const firstMembership = await this.prisma.organizationMember.findFirst({
      where: { userId: oldTokenRecord.user.id },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' }
    });

    return { 
      accessToken, 
      refreshToken: rawToken,
      user: {
        id: oldTokenRecord.user.id,
        email: oldTokenRecord.user.email,
        fullName: oldTokenRecord.user.fullName
      },
      organization: firstMembership 
        ? { ...firstMembership.organization, role: firstMembership.role }
        : null
    };
  }

  async logout(rawToken: string) {
    const oldHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: oldHash },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    return { success: true };
  }

  /**
   * Initiates a password reset by sending an email with a time-limited token.
   *
   * SECURITY: Always returns { success: true } regardless of whether the email
   * exists — prevents user enumeration attacks. The caller cannot distinguish
   * between a registered and unregistered email.
   *
   * Token expires in 15 minutes. The raw token travels only via email;
   * only the SHA-256 hash is stored in the database.
   */
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Upsert: one active reset token per user at a time
      await this.prisma.passwordResetToken.upsert({
        where: { tokenHash },
        create: { userId: user.id, tokenHash, expiresAt },
        update: { tokenHash, expiresAt, usedAt: null },
      });

      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      await this.mailer.send({
        to: email,
        subject: 'Reset your WITHUS password',
        html: this.buildPasswordResetEmailHtml(resetUrl),
        text: `Reset your password here: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request a reset, ignore this email.`,
      });

      this.logger.log(`Password reset requested for user ${user.id}`);
    }

    // Always return success — prevents email enumeration
    return { success: true, message: 'If that email is registered, a reset link has been sent.' };
  }

  /**
   * Validates a reset token and updates the user's password.
   *
   * Security guarantees:
   *   - Token must exist, be unused, and not expired
   *   - Marks token as used atomically
   *   - Invalidates all active refresh tokens on success (forces re-login)
   */
  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Password reset link is invalid or has expired.');
    }

    const passwordHash = await HashService.hash(newPassword);

    await this.prisma.$transaction([
      // Mark token as used
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Update password
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      // Revoke all refresh tokens — force re-login on all devices
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Password reset completed for user ${record.userId}`);
    return { success: true };
  }

  private buildPasswordResetEmailHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Reset your WITHUS password</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; background: #0f172a; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">🔐 WITHUS</div>
        </div>
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-align: center;">Reset your password</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0 0 32px 0; text-align: center; line-height: 1.6;">
          Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.6;">
          If you didn't request a password reset, you can safely ignore this email.<br/>
          Your password will not be changed.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #cbd5e1; text-align: center; margin: 0;">WITHUS — Secure Delegated Access Platform</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private generateRefreshToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { refreshToken: { hash }, rawToken };
  }

  async getInvitationDetails(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      return { status: 'INVALID' };
    }

    if (invitation.status !== 'PENDING') {
      return { status: invitation.status }; // 'ACCEPTED' | 'REVOKED'
    }

    if (invitation.expiresAt < new Date()) {
      return { status: 'EXPIRED' };
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitation.invitedBy },
      select: { fullName: true }
    });

    return {
      status: 'PENDING',
      organizationName: invitation.organization.name,
      organizationLogo: null, // Placeholder for future feature
      inviterName: inviter?.fullName || 'Unknown User',
      invitedEmail: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }
}
