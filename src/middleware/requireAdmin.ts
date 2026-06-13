import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../bindings'
import { verifyAccessJwt } from '../lib/access'

/**
 * Gates every admin route. Cloudflare Access sits in front of /admin*, AND we
 * independently verify the `Cf-Access-Jwt-Assertion` JWT here so there is no
 * unprotected path to admin code (this runs regardless of how the route is hit).
 *
 * The local dev bypass (DEV_ADMIN_BYPASS="true") is honored ONLY when Access is
 * not configured, i.e. it is inert in any real deployment that has set
 * ACCESS_TEAM_DOMAIN / ACCESS_AUD — so it can never silently disable JWT
 * verification in production, even if the var is accidentally left on.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const accessConfigured = Boolean(c.env.ACCESS_TEAM_DOMAIN && c.env.ACCESS_AUD)

  if (!accessConfigured) {
    if (c.env.DEV_ADMIN_BYPASS === 'true') {
      c.set('admin', { email: 'dev@localhost', name: 'Dev Admin' })
      return next()
    }
    return c.text('Admin nicht konfiguriert: ACCESS_TEAM_DOMAIN / ACCESS_AUD fehlen.', 403)
  }

  const token = c.req.header('cf-access-jwt-assertion') ?? getCookie(c, 'CF_Authorization')
  if (!token) return c.text('Forbidden', 403)

  try {
    c.set('admin', await verifyAccessJwt(token, c.env))
    return next()
  } catch {
    return c.text('Forbidden', 403)
  }
})

/**
 * Cloudflare Access logout URL (clears the Access session). Built on the app's
 * own domain — per Cloudflare's docs this deletes the app cookie directly (more
 * instantaneous) — and carries a `returnTo` so the user lands back on the public
 * landing page (`/`, ungated) instead of Cloudflare's generic logged-out page.
 */
export function accessLogoutUrl(baseUrl: string): string {
  const root = baseUrl.replace(/\/$/, '')
  return `${root}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(`${root}/`)}`
}
