import { fileURLToPath } from 'node:url'
import {
  defineWorkersConfig,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig(async () => {
  const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url))
  const migrations = await readD1Migrations(migrationsDir)

  return {
    test: {
      setupFiles: ['./test/apply-migrations.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          isolatedStorage: true,
          wrangler: { configPath: './wrangler.jsonc' },
          miniflare: {
            // Hand the parsed migrations to the test setup file.
            bindings: { TEST_MIGRATIONS: migrations },
            // Local dev/test admin bypass so admin integration tests can run,
            // while the auth-guard tests exercise the real JWT path explicitly.
            vars: { DEV_ADMIN_BYPASS: 'false' },
          },
        },
      },
    },
  }
})
