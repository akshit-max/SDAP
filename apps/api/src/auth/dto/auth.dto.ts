import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  fullName!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 8 chars)' })
  password!: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Company name' })
  companyName!: string;
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
