import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Password: 'password'
  const passwordHash = '$argon2id$v=19$m=65536,p=4,t=3$OmaquxpGKZNE/1/IMjlhng$lSWT3EFGqgxbffduHIoqqX0mE/nVKGYEmvT4wHV5L6k';

  // 1. Create Users
  const owner = await prisma.user.upsert({
    where: { email: 'owner@sdap.local' },
    update: {},
    create: { email: 'owner@sdap.local', passwordHash, isActive: true },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sdap.local' },
    update: {},
    create: { email: 'admin@sdap.local', passwordHash, isActive: true },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@sdap.local' },
    update: {},
    create: { email: 'member@sdap.local', passwordHash, isActive: true },
  });

  console.log('Created users: owner, admin, member');

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      createdBy: owner.id,
      updatedBy: owner.id,
    },
  });

  console.log('Created Organization: Acme Corp');

  // 3. Create Memberships
  // Owner
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: owner.id,
      role: 'OWNER',
      createdBy: owner.id,
      updatedBy: owner.id,
    },
  });

  // Admin
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: admin.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: admin.id,
      role: 'ADMIN',
      createdBy: owner.id,
      updatedBy: owner.id,
    },
  });

  // Member
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: member.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: member.id,
      role: 'MEMBER',
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  console.log('Assigned roles: OWNER, ADMIN, MEMBER');

  // 4. Create Pending Invitation
  const rawToken = 'seed-pending-token';
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.organizationInvitation.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'pending@sdap.local' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'pending@sdap.local',
      tokenHash,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: admin.id,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  console.log('Created Pending Invitation for pending@sdap.local');
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
