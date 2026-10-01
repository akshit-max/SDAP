const { PrismaClient } = require('./packages/db/dist/index.js');
const prisma = new PrismaClient();
prisma.organization.findMany({
  orderBy: { createdAt: 'desc' },
  take: 3,
  select: { id: true, name: true, createdAt: true, subscription: { select: { plan: true, status: true, complianceState: true, selectedPlatforms: true } } }
}).then(r => { console.log(JSON.stringify(r, null, 2)); prisma.$disconnect(); })
  .catch(e => { console.error(e.message); prisma.$disconnect(); });
