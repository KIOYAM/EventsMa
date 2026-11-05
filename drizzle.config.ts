import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: ['./lib/db/schema.ts', './lib/db/schema-catering.ts', './lib/db/schema-services.ts'],
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Direct connection (port 5432) for migrations; the app uses the pooler.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
})
