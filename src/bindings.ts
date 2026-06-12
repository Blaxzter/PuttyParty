import type { GameRoom } from './do/GameRoom'

/** Worker bindings + vars (see wrangler.jsonc). */
export interface Env {
  DB: D1Database
  GAME_ROOM: DurableObjectNamespace<GameRoom>
  ASSETS: Fetcher
  /** Base URL used to build public QR/share links, e.g. https://puttparty.ch */
  APP_BASE_URL: string
  /** Cloudflare Access team domain, e.g. myteam.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN: string
  /** Access application AUD tag. */
  ACCESS_AUD: string
  /** "true" to bypass admin auth locally (never in prod). */
  DEV_ADMIN_BYPASS: string
}

/** Identity resolved from the Access JWT (or the dev bypass). */
export interface AdminIdentity {
  email: string
  name: string
}

export type Variables = {
  admin: AdminIdentity
}

export type AppEnv = { Bindings: Env; Variables: Variables }
