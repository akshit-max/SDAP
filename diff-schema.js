const { execSync } = require('child_process');
require('dotenv').config({path: '.env'});

try {
  const url = process.env.DATABASE_URL;
  const result = execSync(`npx prisma migrate diff --from-url "${url}" --to-schema-datamodel packages/db/prisma/schema.prisma --script`, { encoding: 'utf-8' });
  console.log("SQL DIFF:\n" + result);
} catch (e) {
  console.error(e.stdout || e.message);
}
