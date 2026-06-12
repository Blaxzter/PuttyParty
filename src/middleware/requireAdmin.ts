import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../bindings'
import { verifyAccessJwt } from '../lib/access'

/**
 * Gates every admin route. Cloudflare Access sits in front of /admin*, AND we
 * independently verify the `Cf-Access-Jwt-Assertion` JWT here so there is no
 * unprotected path to admin code (this runs regardless of how the route is hit).
 *
 * Local dev has no Access: set DEV_ADMIN_BYPASS="true" in .dev.vars to develop
 * admin with a mock identity. This must never be enabled in production.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.DEV_ADMIN_BYPASS === 'true') {
    c.set('admin', { email: 'dev@localhost', name: 'Dev Admin' })
    return next()
  }

  if (!c.env.ACCESS_TEAM_DOMAIN || !c.env.ACCESS_AUD) {
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

/** Cloudflare Access logout URL (clears the Access session). */
export function accessLogoutUrl(teamDomain: string): string {
  return teamDomain ? `https://${teamDomain}/cdn-cgi/access/logout` : '/cdn-cgi/access/logout'
}
