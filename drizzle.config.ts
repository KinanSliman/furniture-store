// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// drizzle-kit uses a bundled pg TCP driver for schema introspection.
// DATABASE_URL points to the PgBouncer pooler which is incompatible with
// the pg_catalog queries drizzle-kit runs. Use the direct (unpooled) URL instead.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!migrationUrl) throw new Error('No DATABASE_URL defined in .env.local');

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;
