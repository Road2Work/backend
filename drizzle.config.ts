import { defineConfig } from 'drizzle-kit';
import env from './src/config/env.ts';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    host: env.PGHOST!,
    port: Number(env.PGPORT) || 5432,
    database: env.PGDATABASE!,
    user: env.PGUSER!,
    password: env.PGPASSWORD || '',
    ssl: env.PGSSLMODE !== 'disable' ? { rejectUnauthorized: false } : false,
  },
});