const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT count(*) FROM public."Subscription"')
  .then(console.log)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
