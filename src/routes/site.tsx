import { Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import { createGame, getDb } from '../db/queries'
import { newManageId, newPublicId } from '../lib/ids'
import { createGameSchema, fieldErrors } from '../lib/validation'
import { GameFormBody } from '../ui/admin/GameForm'
import { LandingPage } from '../ui/Landing'
import { draftFromBody } from './manageActions'

// Public marketing landing + open (unauthenticated) self-service game creation.
export const siteRoutes = new Hono<AppEnv>()

const baseUrl = (env: Env): string => env.APP_BASE_URL.replace(/\/$/, '')

siteRoutes.get('/', (c) => c.html(<LandingPage baseUrl={baseUrl(c.env)} />))

siteRoutes.post('/games', async (c) => {
  const body = await c.req.parseBody()
  const parsed = createGameSchema.safeParse(body)
  if (!parsed.success) {
    return c.html(
      <GameFormBody
        mode="create"
        createPath="/games"
        values={draftFromBody(body)}
        errors={fieldErrors(parsed.error)}
      />,
    )
  }
  const manageId = newManageId()
  await createGame(getDb(c.env), {
    publicId: newPublicId(),
    manageId,
    name: parsed.data.name,
    date: parsed.data.date,
    location: parsed.data.location,
    holes: parsed.data.holes,
    entryMode: parsed.data.entryMode,
    teamsEnabled: parsed.data.teamsEnabled,
    status: parsed.data.status,
  })
  // Send the creator to their secret manage URL.
  c.header('HX-Redirect', `/m/${manageId}`)
  return c.body(null, 200)
})
