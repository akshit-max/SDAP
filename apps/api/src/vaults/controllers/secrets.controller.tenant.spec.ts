import { NotFoundException } from '@nestjs/common';
import { SecretsController } from './secrets.controller';

// F-004: secret list/detail/create must be scoped to the org in the URL.
describe('SecretsController — tenant scoping (F-004)', () => {
  const req: any = { user: { id: 'user-1' } };
  const meta = { id: 'secret-1', vaultId: 'vault-1', name: 'GitHub' };

  function build(vaultInOrg: boolean) {
    const prisma: any = {
      vault: {
        findFirst: jest
          .fn()
          .mockResolvedValue(vaultInOrg ? { id: 'vault-1' } : null),
      },
    };
    const secrets: any = {
      createSecret: jest.fn().mockResolvedValue({ id: 'secret-1' }),
      getSecretsByVaultId: jest.fn().mockResolvedValue([meta]),
      getSecretMetadataById: jest.fn().mockResolvedValue(meta),
    };
    const controller = new SecretsController(secrets, prisma, undefined as any);
    return { controller, prisma, secrets };
  }

  it('same-org: list, detail and create behave exactly as before', async () => {
    const { controller, prisma } = build(true);
    await expect(controller.getSecrets('org-1', 'vault-1')).resolves.toEqual([
      meta,
    ]);
    await expect(
      controller.getSecretById('org-1', 'vault-1', 'secret-1'),
    ).resolves.toEqual(meta);
    await expect(
      controller.createSecret('org-1', 'vault-1', req, {
        name: 'n',
        plaintext: 'p',
      } as any),
    ).resolves.toEqual({ id: 'secret-1' });
    expect(prisma.vault.findFirst).toHaveBeenCalledWith({
      where: { id: 'vault-1', organizationId: 'org-1' },
      select: { id: true },
    });
  });

  it('cross-org vault: list, detail and create are refused before any lookup/write', async () => {
    const { controller, secrets } = build(false);
    await expect(controller.getSecrets('org-2', 'vault-1')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      controller.getSecretById('org-2', 'vault-1', 'secret-1'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      controller.createSecret('org-2', 'vault-1', req, {
        name: 'n',
        plaintext: 'p',
      } as any),
    ).rejects.toThrow(NotFoundException);
    expect(secrets.getSecretsByVaultId).not.toHaveBeenCalled();
    expect(secrets.getSecretMetadataById).not.toHaveBeenCalled();
    expect(secrets.createSecret).not.toHaveBeenCalled();
  });

  it('detail: secret from a different vault (of the same org) is refused', async () => {
    const { controller } = build(true);
    await expect(
      controller.getSecretById('org-1', 'vault-other', 'secret-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
