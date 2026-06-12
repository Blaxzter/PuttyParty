import type { Env as AppEnv } from '../src/bindings'

// `cloudflare:test` types `env` as `Cloudflare.Env`. Make it our app bindings
// plus the migrations injected via vitest.config.ts.
declare global {
  namespace Cloudflare {
    interface Env extends AppEnv {
      TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
    }
  }
}
