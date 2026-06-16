import { Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import {
  createGame,
  getDb,
  getGameByPublicId,
  listEntries,
  listGamesWithCounts,
} from '../db/queries'
import type { Game } from '../db/schema'
import { newManageId, newPublicId } from '../lib/ids'
import { createGameSchema, fieldErrors } from '../lib/validation'
import { accessLogoutUrl, requireAdmin } from '../middleware/requireAdmin'
import { DashboardPage } from '../ui/admin/Dashboard'
import { GameFormBody } from '../ui/admin/GameForm'
import { ManagePage } from '../ui/admin/Manage'
import { NotFoundPage } from '../ui/NotFound'
import {
  addEntry,
  draftFromBody,
  editEntry,
  getEntriesPartial,
  type ManageTargets,
  removeEntry,
  removeGame,
  resetAllEntries,
  updateGameSettingsOrStatus,
} from './manageActions'

export const adminRoutes = new Hono<AppEnv>()

// Verify the Access JWT on every admin route — no unprotected path to admin code.
adminRoutes.use('*', requireAdmin)

const baseUrl = (env: Env): string => env.APP_BASE_URL.replace(/\/$/, '')

async function loadGame(env: Env, publicId: string): Promise<Game | undefined> {
  return getGameByPublicId(getDb(env), publicId)
}

const basePathFor = (game: Game): string => `/admin/games/${game.publicId}`
const targetsFor = (game: Game): ManageTargets => ({
  basePath: basePathFor(game),
  onArchive: '/admin',
  onDelete: '/admin',
})

// ---- Dashboard ----
adminRoutes.get('/', async (c) => {
  const games = await listGamesWithCounts(getDb(c.env))
  return c.html(
    <DashboardPage
      admin={c.get('admin')}
      logoutUrl={accessLogoutUrl(baseUrl(c.env))}
      baseUrl={baseUrl(c.env)}
      games={games}
    />,
  )
})

// ---- Create game ----
adminRoutes.post('/games', async (c) => {
  const body = await c.req.parseBody()
  const parsed = createGameSchema.safeParse(body)
  if (!parsed.success) {
    return c.html(
      <GameFormBody
        mode="create"
        createPath="/admin/games"
        values={draftFromBody(body)}
        errors={fieldErrors(parsed.error)}
      />,
    )
  }
  const game = await createGame(getDb(c.env), {
    publicId: newPublicId(),
    manageId: newManageId(),
    name: parsed.data.name,
    date: parsed.data.date,
    location: parsed.data.location,
    holes: parsed.data.holes,
    entryMode: parsed.data.entryMode,
    teamsEnabled: parsed.data.teamsEnabled,
    status: parsed.data.status,
    locale: parsed.data.locale ?? 'de',
  })
  c.header('HX-Redirect', `/admin/games/${game.publicId}`)
  return c.body(null, 200)
})

// ---- Manage game ----
adminRoutes.get('/games/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.html(<NotFoundPage message="Spiel nicht gefunden." />, 404)
  const entries = await listEntries(getDb(c.env), game.id)
  return c.html(
    <ManagePage
      game={game}
      entries={entries}
      baseUrl={baseUrl(c.env)}
      basePath={basePathFor(game)}
      backLink={{ href: '/admin', label: '← Dashboard · Spiel verwalten' }}
    />,
  )
})

adminRoutes.patch('/games/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return updateGameSettingsOrStatus(c, game, targetsFor(game))
})

adminRoutes.delete('/games/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return removeGame(c, game, targetsFor(game))
})

// ---- Entries ----
adminRoutes.get('/games/:publicId/entries', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return getEntriesPartial(c, game, basePathFor(game))
})

adminRoutes.post('/games/:publicId/entries', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return addEntry(c, game, basePathFor(game))
})

adminRoutes.patch('/games/:publicId/entries/:entryId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return editEntry(c, game, Number(c.req.param('entryId')), basePathFor(game))
})

adminRoutes.delete('/games/:publicId/entries/:entryId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return removeEntry(c, game, Number(c.req.param('entryId')), basePathFor(game))
})

adminRoutes.post('/games/:publicId/reset', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return resetAllEntries(c, game, basePathFor(game))
})
