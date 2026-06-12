import { type Context, Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import {
  createEntry,
  createGame,
  deleteEntry,
  deleteGame,
  getDb,
  getGameByPublicId,
  listEntries,
  listGamesWithCounts,
  resetEntries,
  updateEntry,
  updateGame,
} from '../db/queries'
import type { Game } from '../db/schema'
import { newPublicId } from '../lib/ids'
import { adminEntrySchema, createGameSchema, fieldErrors } from '../lib/validation'
import { accessLogoutUrl, requireAdmin } from '../middleware/requireAdmin'
import { notifyBoard } from '../realtime'
import { DashboardPage } from '../ui/admin/Dashboard'
import { EntriesTable, type RowDraft } from '../ui/admin/EntriesTable'
import { GameFormBody, type GameFormValues } from '../ui/admin/GameForm'
import { ManagePage, StatusToggle } from '../ui/admin/Manage'
import { NotFoundPage } from '../ui/NotFound'

export const adminRoutes = new Hono<AppEnv>()

// Verify the Access JWT on every admin route — no unprotected path to admin code.
adminRoutes.use('*', requireAdmin)

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const baseUrl = (env: Env): string => env.APP_BASE_URL.replace(/\/$/, '')

function draftFromBody(body: Record<string, unknown>): GameFormValues {
  return {
    name: str(body.name),
    date: str(body.date),
    location: str(body.location),
    holes: str(body.holes),
    entryMode: body.entryMode === 'per_hole' ? 'per_hole' : 'total',
    teamsEnabled: body.teamsEnabled === 'on' || body.teamsEnabled === 'true',
    status: body.status === 'locked' ? 'locked' : 'open',
  }
}

async function loadGame(env: Env, publicId: string): Promise<Game | undefined> {
  return getGameByPublicId(getDb(env), publicId)
}

/** Re-renders the entries table partial. */
async function entriesResponse(
  c: Context<AppEnv>,
  game: Game,
  opts: {
    editId?: number
    addMode?: boolean
    draft?: RowDraft
    errors?: Record<string, string>
  } = {},
) {
  const entries = await listEntries(getDb(c.env), game.id)
  return c.html(<EntriesTable game={game} entries={entries} {...opts} />)
}

async function broadcast(c: { env: Env }, game: Game): Promise<void> {
  try {
    await notifyBoard(c.env, game)
  } catch {
    /* boards recover via polling */
  }
}

// ---- Dashboard ----
adminRoutes.get('/', async (c) => {
  const games = await listGamesWithCounts(getDb(c.env))
  return c.html(
    <DashboardPage
      admin={c.get('admin')}
      logoutUrl={accessLogoutUrl(c.env.ACCESS_TEAM_DOMAIN)}
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
        values={draftFromBody(body)}
        errors={fieldErrors(parsed.error)}
      />,
    )
  }
  const game = await createGame(getDb(c.env), {
    publicId: newPublicId(),
    name: parsed.data.name,
    date: parsed.data.date,
    location: parsed.data.location,
    holes: parsed.data.holes,
    entryMode: parsed.data.entryMode,
    teamsEnabled: parsed.data.teamsEnabled,
    status: parsed.data.status,
  })
  c.header('HX-Redirect', `/admin/games/${game.publicId}`)
  return c.body(null, 200)
})

// ---- Manage game ----
adminRoutes.get('/games/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.html(<NotFoundPage message="Spiel nicht gefunden." />, 404)
  const entries = await listEntries(getDb(c.env), game.id)
  return c.html(<ManagePage game={game} entries={entries} baseUrl={baseUrl(c.env)} />)
})

// ---- Update game (settings edit OR status toggle/archive) ----
adminRoutes.patch('/games/:publicId', async (c) => {
  const db = getDb(c.env)
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  const body = await c.req.parseBody()

  // Full settings edit (the modal submits a `name`); the status toggle does not.
  if (typeof body.name === 'string') {
    const parsed = createGameSchema.safeParse(body)
    if (!parsed.success) {
      return c.html(
        <GameFormBody
          mode="edit"
          game={game}
          values={draftFromBody(body)}
          errors={fieldErrors(parsed.error)}
        />,
      )
    }
    await updateGame(db, game.publicId, {
      name: parsed.data.name,
      date: parsed.data.date,
      location: parsed.data.location,
      holes: parsed.data.holes,
      entryMode: parsed.data.entryMode,
      teamsEnabled: parsed.data.teamsEnabled,
      status: parsed.data.status,
    })
    c.header('HX-Redirect', `/admin/games/${game.publicId}`)
    return c.body(null, 200)
  }

  // Status toggle / archive
  const next = str(body.status)
  if (next !== 'open' && next !== 'locked' && next !== 'archived') {
    return c.text('bad_request', 400)
  }
  const updated = (await updateGame(db, game.publicId, { status: next })) ?? game
  if (next === 'archived') {
    c.header('HX-Redirect', '/admin')
    return c.body(null, 200)
  }
  return c.html(<StatusToggle game={updated} />)
})

// ---- Delete game (hard delete; archive is the softer default in the UI) ----
adminRoutes.delete('/games/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  await deleteGame(getDb(c.env), game.id)
  c.header('HX-Redirect', '/admin')
  return c.body(null, 200)
})

// ---- Entries table partial (edit/add toggles) ----
adminRoutes.get('/games/:publicId/entries', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  const editParam = c.req.query('edit')
  const editId = editParam ? Number(editParam) : undefined
  const addMode = c.req.query('add') === '1'
  return entriesResponse(c, game, {
    editId: Number.isFinite(editId) ? editId : undefined,
    addMode,
  })
})

// ---- Add entry on behalf ----
adminRoutes.post('/games/:publicId/entries', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  const body = await c.req.parseBody()
  const parsed = adminEntrySchema.safeParse(body)
  if (!parsed.success) {
    return entriesResponse(c, game, {
      addMode: true,
      draft: { name: str(body.name), team: str(body.team), strokes: str(body.strokes) },
      errors: fieldErrors(parsed.error),
    })
  }
  await createEntry(getDb(c.env), {
    gameId: game.id,
    name: parsed.data.name,
    team: parsed.data.team,
    strokes: parsed.data.strokes,
    holeStrokes: null,
  })
  await broadcast(c, game)
  return entriesResponse(c, game)
})

// ---- Edit entry ----
adminRoutes.patch('/games/:publicId/entries/:entryId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  const entryId = Number(c.req.param('entryId'))
  const body = await c.req.parseBody()
  const parsed = adminEntrySchema.safeParse(body)
  if (!parsed.success) {
    return entriesResponse(c, game, {
      editId: entryId,
      draft: { name: str(body.name), team: str(body.team), strokes: str(body.strokes) },
      errors: fieldErrors(parsed.error),
    })
  }
  await updateEntry(getDb(c.env), game.id, entryId, {
    name: parsed.data.name,
    team: parsed.data.team,
    strokes: parsed.data.strokes,
  })
  await broadcast(c, game)
  return entriesResponse(c, game)
})

// ---- Delete entry ----
adminRoutes.delete('/games/:publicId/entries/:entryId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  await deleteEntry(getDb(c.env), game.id, Number(c.req.param('entryId')))
  await broadcast(c, game)
  return entriesResponse(c, game)
})

// ---- Reset all entries ----
adminRoutes.post('/games/:publicId/reset', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  await resetEntries(getDb(c.env), game.id)
  await broadcast(c, game)
  return entriesResponse(c, game)
})
