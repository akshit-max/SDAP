require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT * FROM _prisma_migrations`.then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
