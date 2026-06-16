import { Hono } from 'hono'
import type { AppEnv } from './bindings'
import { page } from './i18n/render'
import { i18nMiddleware } from './middleware/i18n'
import { adminRoutes } from './routes/admin'
import { manageRoutes } from './routes/manage'
import { publicRoutes } from './routes/public'
import { siteRoutes } from './routes/site'
import { NotFoundPage } from './ui/NotFound'

// The Durable Object class must be exported from the Worker entrypoint.
export { GameRoom } from './do/GameRoom'

const app = new Hono<AppEnv>()

app.get('/healthz', (c) => c.text('ok'))

// Resolve the visitor's locale (and expose c.var.i18n) for every page render.
app.use('*', i18nMiddleware)

// Public landing + open self-service game creation (GET /, POST /games).
app.route('/', siteRoutes)

// Self-service management via the secret manage token (no auth; token = capability).
app.route('/m', manageRoutes)

// Public game pages (opaque publicId, no auth).
app.route('/g', publicRoutes)

// Org admin (behind Cloudflare Access + in-Worker JWT verification).
app.route('/admin', adminRoutes)

// Any unmatched path (e.g. /g/:publicId/admin) gets the branded 404 instead of
// Hono's bare "404 Not Found" plain-text fallback.
app.notFound((c) => page(c, <NotFoundPage />, 404))

export default app
