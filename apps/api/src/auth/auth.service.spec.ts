import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

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
      create: jest.fn().mockResolvedValue({ id: '1', email: 'new@test.com', fullName: 'Test User' }),
    },
    organizationMember: {
      create: jest.fn(),
      findFirst: jest.fn().mockResolvedValue({ organization: { id: 'org-1', name: 'Test Org' } }),
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') {
         return cb(mockPrismaService);
      }
      return Promise.all(cb);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: PrismaService, useValue: mockPrismaService },
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
        service.register({ email: 'test@test.com', password: 'password123', fullName: 'Test User', companyName: 'Acme Corp' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user, org, and member and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Acme Corp'
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
});
