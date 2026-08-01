import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
    const dto = { email: 'test@test.com', password: 'password123', fullName: 'Test', companyName: 'Corp' };
    const mockReq = { headers: { 'user-agent': 'jest' } } as any;
    const mockRes = { cookie: jest.fn() } as any;
    const result = await controller.register(dto, mockReq, mockRes, '127.0.0.1');
    expect(mockAuthService.register).toHaveBeenCalledWith(dto, '127.0.0.1', 'jest');
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
    const result = await controller.logout(dto, { cookies: {} } as any, mockRes);
    expect(mockAuthService.logout).toHaveBeenCalledWith('my-token');
    expect(result.success).toBe(true);
  });
});
