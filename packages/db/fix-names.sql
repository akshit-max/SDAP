UPDATE "Secret" SET name = name || '_deleted_' || id WHERE "deletedAt" IS NOT NULL AND name NOT LIKE '%_deleted_%';
