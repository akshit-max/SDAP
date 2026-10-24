import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../notifications/mailer.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let _usersService: UsersService;
  let _tokenService: TokenService;
  let _prisma: PrismaService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockPrismaService: any = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
    },
    user: {
      create: jest.fn().mockResolvedValue({
        id: '1',
        email: 'new@test.com',
        fullName: 'Test User',
      }),
    },
    organizationMember: {
      create: jest.fn(),
      findFirst: jest
        .fn()
        .mockResolvedValue({ organization: { id: 'org-1', name: 'Test Org' } }),
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrismaService);
      }
      return Promise.all(cb);
    }),
  };

  const mockMailerService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'GOOGLE_CLIENT_ID' ? 'test-client-id' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _usersService = module.get<UsersService>(UsersService);
    _tokenService = module.get<TokenService>(TokenService);
    _prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    it('should throw BadRequestException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          fullName: 'Test User',
          companyName: 'Acme Corp',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user, org, and member and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Acme Corp',
      });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.organization).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.organization.create).toHaveBeenCalled();
      expect(mockPrismaService.organizationMember.create).toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        isActive: false,
        deletedAt: null,
        passwordHash: 'hash',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('should revoke the refresh token', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.logout('raw-token');
      expect(result.success).toBe(true);
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('buildGoogleAuthUrl()', () => {
    it('should generate a Google OAuth URL with a CSRF nonce bound to state', () => {
      const { url, csrf } = service.buildGoogleAuthUrl('/vaults');
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+email+profile');
      expect(url).not.toContain('access_type=offline');
      expect(new URL(url).searchParams.get('redirect_uri')).toBe(
        'http://localhost:3000/api/v1/auth/google/callback',
      );

      const state = new URL(url).searchParams.get('state')!;
      expect(AuthService.parseGoogleState(state)).toEqual({
        csrf,
        redirect: '/vaults',
      });
    });

    it('should drop unsafe redirects from state', () => {
      const { url } = service.buildGoogleAuthUrl('//evil.com');
      const state = new URL(url).searchParams.get('state')!;
      expect(AuthService.parseGoogleState(state)?.redirect).toBe('/dashboard');
    });

    it('should fallback to production domain when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const { url } = service.buildGoogleAuthUrl('/vaults');
        expect(new URL(url).searchParams.get('redirect_uri')).toBe(
          'https://withus.makewithus.in/api/v1/auth/google/callback',
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('sanitizeRedirect()', () => {
    it.each([
      ['/dashboard', '/dashboard'],
      ['/invite/abc123', '/invite/abc123'],
      ['https://evil.com', '/dashboard'],
      ['//evil.com', '/dashboard'],
      ['/\\evil.com', '/dashboard'],
      ['javascript:alert(1)', '/dashboard'],
      [undefined, '/dashboard'],
    ])('%s -> %s', (input, expected) => {
      expect(AuthService.sanitizeRedirect(input)).toBe(expected);
    });
  });

  describe('parseGoogleState()', () => {
    it('should reject malformed or nonce-less state', () => {
      expect(AuthService.parseGoogleState(undefined)).toBeNull();
      expect(AuthService.parseGoogleState('not-base64-json')).toBeNull();
      const noCsrf = Buffer.from(JSON.stringify({ redirect: '/x' })).toString(
        'base64url',
      );
      expect(AuthService.parseGoogleState(noCsrf)).toBeNull();
    });
  });
});
