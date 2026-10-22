import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, GoogleOAuthError } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'user-1', email: 'test@test.com', fullName: 'Test' },
      organization: { id: 'org-1', name: 'Corp' },
    }),
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    refresh: jest.fn().mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    handleGoogleAuth: jest.fn().mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      redirect: '/vaults',
      isNewUser: true,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register() should call authService.register', async () => {
    const dto = {
      email: 'test@test.com',
      password: 'password123',
      fullName: 'Test',
      companyName: 'Corp',
    };
    const mockReq = { headers: { 'user-agent': 'jest' } } as any;
    const mockRes = { cookie: jest.fn() } as any;
    const result = await controller.register(
      dto,
      mockReq,
      mockRes,
      '127.0.0.1',
    );
    expect(mockAuthService.register).toHaveBeenCalledWith(
      dto,
      '127.0.0.1',
      'jest',
    );
    expect(result.accessToken).toBe('access');
  });

  it('login() should call authService.login', async () => {
    const dto = { email: 'test@test.com', password: 'password123' };
    const mockReq = { headers: { 'user-agent': 'jest' } } as any;
    const mockRes = { cookie: jest.fn() } as any;
    const result = await controller.login(dto, mockReq, mockRes, '127.0.0.1');
    expect(mockAuthService.login).toHaveBeenCalledWith(
      dto,
      '127.0.0.1',
      'jest',
    );
    expect(result.accessToken).toBe('access');
  });

  it('logout() should call authService.logout', async () => {
    const dto = { refreshToken: 'my-token' };
    const mockRes = { clearCookie: jest.fn() } as any;
    const result = await controller.logout(
      dto,
      { cookies: {} } as any,
      mockRes,
    );
    expect(mockAuthService.logout).toHaveBeenCalledWith('my-token');
    expect(result.success).toBe(true);
  });

  describe('googleCallback()', () => {
    const state = (csrf: string, redirect = '/vaults') =>
      Buffer.from(JSON.stringify({ csrf, redirect })).toString('base64url');
    const mockRes = () =>
      ({
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
      }) as any;
    const mockReq = (csrf?: string) =>
      ({
        headers: { 'user-agent': 'jest' },
        cookies: csrf ? { sdap_oauth_state: csrf } : {},
      }) as any;

    it('should reject when state nonce does not match the cookie', async () => {
      const res = mockRes();
      await controller.googleCallback(
        'code',
        state('aaa'),
        undefined as any,
        mockReq('bbb'),
        res,
        '127.0.0.1',
      );
      expect(mockAuthService.handleGoogleAuth).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        '/login?error=google_state_mismatch',
      );
    });

    it('should reject when the state cookie is missing', async () => {
      const res = mockRes();
      await controller.googleCallback(
        'code',
        state('aaa'),
        undefined as any,
        mockReq(),
        res,
        '127.0.0.1',
      );
      expect(mockAuthService.handleGoogleAuth).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        '/login?error=google_state_mismatch',
      );
    });

    it('should map a Google denial to google_cancelled', async () => {
      const res = mockRes();
      await controller.googleCallback(
        undefined as any,
        state('aaa'),
        'access_denied',
        mockReq('aaa'),
        res,
        '127.0.0.1',
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/login?error=google_cancelled',
      );
    });

    it('should set session cookies and hand off to the callback page on success', async () => {
      const res = mockRes();
      await controller.googleCallback(
        'code',
        state('aaa'),
        undefined as any,
        mockReq('aaa'),
        res,
        '127.0.0.1',
      );
      expect(mockAuthService.handleGoogleAuth).toHaveBeenCalledWith(
        'code',
        '/vaults',
        '127.0.0.1',
        'jest',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'sdap_token',
        'access',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/auth/callback/google?redirect=%2Fvaults&new=1',
      );
    });

    it('should only expose error codes, never raw messages', async () => {
      const res = mockRes();
      mockAuthService.handleGoogleAuth.mockRejectedValueOnce(
        new Error('Prisma: connection refused'),
      );
      await controller.googleCallback(
        'code',
        state('aaa'),
        undefined as any,
        mockReq('aaa'),
        res,
        '127.0.0.1',
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/login?error=google_failed&redirect=%2Fvaults',
      );

      mockAuthService.handleGoogleAuth.mockRejectedValueOnce(
        new GoogleOAuthError('account_disabled'),
      );
      await controller.googleCallback(
        'code',
        state('aaa'),
        undefined as any,
        mockReq('aaa'),
        res,
        '127.0.0.1',
      );
      expect(res.redirect).toHaveBeenLastCalledWith(
        '/login?error=account_disabled&redirect=%2Fvaults',
      );
    });
  });
});
