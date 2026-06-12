import { Hono } from 'hono'
import type { AppEnv } from './bindings'
import { adminRoutes } from './routes/admin'
import { manageRoutes } from './routes/manage'
import { publicRoutes } from './routes/public'
import { siteRoutes } from './routes/site'

// The Durable Object class must be exported from the Worker entrypoint.
export { GameRoom } from './do/GameRoom'

const app = new Hono<AppEnv>()

app.get('/healthz', (c) => c.text('ok'))

// Public landing + open self-service game creation (GET /, POST /games).
app.route('/', siteRoutes)

// Self-service management via the secret manage token (no auth; token = capability).
app.route('/m', manageRoutes)

// Public game pages (opaque publicId, no auth).
app.route('/g', publicRoutes)

// Org admin (behind Cloudflare Access + in-Worker JWT verification).
app.route('/admin', adminRoutes)

export default app
