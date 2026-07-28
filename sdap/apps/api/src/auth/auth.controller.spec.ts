import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest
      .fn()
      .mockResolvedValue({
        success: true,
        message: 'User registered successfully',
      }),
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    refresh: jest
      .fn()
      .mockResolvedValue({
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
    const dto = { email: 'test@test.com', password: 'password123' };
    const result = await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
  });

  it('login() should call authService.login', async () => {
    const dto = { email: 'test@test.com', password: 'password123' };
    const mockReq = { headers: { 'user-agent': 'jest' } } as any;
    const result = await controller.login(dto, mockReq, '127.0.0.1');
    expect(mockAuthService.login).toHaveBeenCalledWith(
      dto,
      '127.0.0.1',
      'jest',
    );
    expect(result.accessToken).toBe('access');
  });

  it('logout() should call authService.logout', async () => {
    const dto = { refreshToken: 'my-token' };
    const result = await controller.logout(dto);
    expect(mockAuthService.logout).toHaveBeenCalledWith('my-token');
    expect(result.success).toBe(true);
  });
});
