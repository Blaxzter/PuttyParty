import { fileURLToPath } from 'node:url'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url))
  const migrations = await readD1Migrations(migrationsDir)

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          // Handed to the setup file, which applies them to the isolated test DB.
          bindings: { TEST_MIGRATIONS: migrations },
          // Auth-guard tests exercise the real JWT path explicitly.
          vars: { DEV_ADMIN_BYPASS: 'false' },
        },
      }),
    ],
    test: {
      setupFiles: ['./test/apply-migrations.ts'],
    },
  }
})
