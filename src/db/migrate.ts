/**
 * migrate.ts
 *
 * Applies drizzle-kit generated SQL migrations via the Neon HTTP driver
 * (port 443) instead of pg TCP (port 5432), which is often blocked by
 * ISPs / corporate firewalls when connecting to Neon from Windows.
 *
 * Usage:  pnpm db:migrate
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in .env.local');
  }

  const sql = neon(connectionString);
  const db = drizzle(sql);

  console.log('🚀 Running migrations via Neon HTTP...');

  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle/migrations') });

  console.log('✅ Migrations applied successfully!');
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
