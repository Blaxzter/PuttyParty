import { applyD1Migrations, env } from 'cloudflare:test'

// Runs once per test worker before the suite: applies the checked-in D1
// migrations (parsed in vitest.config.ts) to the isolated test database.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
