const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const secrets = await prisma.secret.findMany();
  console.log(secrets.map(s => s.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
