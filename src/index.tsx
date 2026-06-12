import { Hono } from 'hono'
import type { AppEnv } from './bindings'

// The Durable Object class must be exported from the Worker entrypoint.
export { GameRoom } from './do/GameRoom'

const app = new Hono<AppEnv>()

app.get('/healthz', (c) => c.text('ok'))

// Organisers land on the admin dashboard; public users only ever receive /g/:id links.
app.get('/', (c) => c.redirect('/admin'))

// Public (/g/*) and admin (/admin/*) routes are mounted in later build steps.

export default app
