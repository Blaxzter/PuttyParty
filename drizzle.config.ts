import { defineConfig } from 'drizzle-kit'

// `drizzle-kit generate` only needs schema/out/dialect (no DB credentials).
// The checked-in migrations under ./migrations are applied with
// `wrangler d1 migrations apply` (see package.json scripts / README).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
})
