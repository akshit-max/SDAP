const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL -> ' + url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
  
  if (!url.includes('localhost:5432')) {
    console.error('ERROR: Not connected to localhost!');
    process.exit(1);
  }
  
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('SUCCESS: Connected to local PostgreSQL via Prisma.');
  } catch (err) {
    console.error('Failed to connect:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
main();
