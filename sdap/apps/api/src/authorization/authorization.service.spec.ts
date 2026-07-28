import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { MembershipResolver } from './resolvers/membership.resolver';
import { PermissionEvaluator } from './evaluators/permission.evaluator';
import { Permission } from '@repo/types';
import { ForbiddenException } from '@nestjs/common';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let membershipResolver: MembershipResolver;
  let permissionEvaluator: PermissionEvaluator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: MembershipResolver,
          useValue: {
            resolveMembership: jest.fn(),
          },
        },
        PermissionEvaluator,
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    membershipResolver = module.get<MembershipResolver>(MembershipResolver);
    permissionEvaluator = module.get<PermissionEvaluator>(PermissionEvaluator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow if no permissions are required', async () => {
    const result = await service.checkPermissions(
      { userId: '1', organizationId: '2' },
      [],
    );
    expect(result).toBe(true);
  });

  it('should allow OWNER to invite member', async () => {
    jest
      .spyOn(membershipResolver, 'resolveMembership')
      .mockResolvedValue({ role: 'OWNER' } as any);

    const result = await service.checkPermissions(
      { userId: '1', organizationId: '2' },
      [Permission.MEMBER_INVITE],
    );

    expect(result).toBe(true);
  });

  it('should block MEMBER from inviting member', async () => {
    jest
      .spyOn(membershipResolver, 'resolveMembership')
      .mockResolvedValue({ role: 'MEMBER' } as any);

    await expect(
      service.checkPermissions({ userId: '1', organizationId: '2' }, [
        Permission.MEMBER_INVITE,
      ]),
    ).rejects.toThrow(ForbiddenException);
  });
});
