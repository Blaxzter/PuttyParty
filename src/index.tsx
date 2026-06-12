import { Hono } from 'hono'
import type { AppEnv } from './bindings'
import { publicRoutes } from './routes/public'

// The Durable Object class must be exported from the Worker entrypoint.
export { GameRoom } from './do/GameRoom'

const app = new Hono<AppEnv>()

app.get('/healthz', (c) => c.text('ok'))

// Public game pages (opaque publicId, no auth).
app.route('/g', publicRoutes)

// Organisers land on the admin dashboard; public users only ever receive /g/:id links.
app.get('/', (c) => c.redirect('/admin'))

// Admin (/admin/*) routes are mounted in a later build step.

export default app
