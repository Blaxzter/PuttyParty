import type { GameRoom } from './do/GameRoom'
import type { I18n } from './i18n'

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
  /** Cloudflare Turnstile public site key (empty = widget disabled). */
  TURNSTILE_SITE_KEY: string
  /** Cloudflare Turnstile secret key (empty = verification skipped). Set as a secret. */
  TURNSTILE_SECRET_KEY: string
  // Impressum / Datenschutz operator details (kept out of git — see src/lib/legalInfo.ts).
  LEGAL_NAME: string
  LEGAL_STREET: string
  LEGAL_CITY: string
  LEGAL_COUNTRY: string
  LEGAL_EMAIL: string
  LEGAL_PHONE: string
}

/** Identity resolved from the Access JWT (or the dev bypass). */
export interface AdminIdentity {
  email: string
  name: string
}

export type Variables = {
  admin: AdminIdentity
  /** Per-request locale + dictionary, set by i18nMiddleware. */
  i18n: I18n
}

export type AppEnv = { Bindings: Env; Variables: Variables }
