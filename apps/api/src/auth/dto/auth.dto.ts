import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  fullName!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 8 chars)' })
  password!: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Company name (if creating a workspace)' })
  companyName?: string;

  @ApiPropertyOptional({ example: 'abc123xyz', description: 'Invite token (if joining via invitation)' })
  inviteToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'The refresh token' })
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from email' })
  token!: string;

  @ApiProperty({ example: 'new_password123', description: 'New password (min 8 chars)' })
  password!: string;
}
