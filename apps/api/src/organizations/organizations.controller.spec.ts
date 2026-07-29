import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const mockOrg = { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' };

  const mockOrganizationsService = {
    create: jest.fn().mockResolvedValue(mockOrg),
    findAllForUser: jest.fn().mockResolvedValue([mockOrg]),
    findOne: jest.fn().mockResolvedValue(mockOrg),
    update: jest.fn().mockResolvedValue({ ...mockOrg, name: 'Updated Corp' }),
    invite: jest.fn().mockResolvedValue({ rawToken: 'tok123' }),
    acceptInvite: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    })
      // Override guards to bypass JWT + permissions in unit tests
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockReq = { user: { id: 'user-1', email: 'user@test.com' } };

  describe('create()', () => {
    it('should return the new organization', async () => {
      const result = await controller.create(mockReq, { name: 'Acme Corp' });
      expect(result).toEqual({ success: true, data: mockOrg });
      expect(mockOrganizationsService.create).toHaveBeenCalledWith('user-1', {
        name: 'Acme Corp',
      });
    });
  });

  describe('findAll()', () => {
    it('should return all organizations for user', async () => {
      const result = await controller.findAll(mockReq);
      expect(result).toEqual({ success: true, data: [mockOrg] });
    });
  });

  describe('findOne()', () => {
    it('should return a single organization', async () => {
      const result = await controller.findOne(mockReq, 'org-1');
      expect(result).toEqual({ success: true, data: mockOrg });
    });
  });

  describe('update()', () => {
    it('should update and return the organization', async () => {
      const result = await controller.update(mockReq, 'org-1', {
        name: 'Updated Corp',
      });
      expect(result.data.name).toBe('Updated Corp');
    });
  });

  describe('acceptInvite()', () => {
    it('should accept an invitation', async () => {
      const result = await controller.acceptInvite(mockReq, 'my-token');
      expect(result.success).toBe(true);
    });
  });
});
