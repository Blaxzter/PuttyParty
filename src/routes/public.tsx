import { Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import { createEntry, getDb, getGameByPublicId, listEntries } from '../db/queries'
import type { Game } from '../db/schema'
import { toRankable } from '../do/protocol'
import { qrSvg } from '../lib/qr'
import { computeStandings, diffStandings, placementFor } from '../lib/ranking'
import { fieldErrors, perHoleEntrySchema, totalEntrySchema } from '../lib/validation'
import { entryUrlFor, gameRoom, notifyBoard, syncBoard } from '../realtime'
import { BoardPage } from '../ui/board/Board'
import { renderStandings } from '../ui/board/standings'
import {
  type EntryFormValues,
  EntryLockedPage,
  EntryPage,
  EntrySuccessPage,
} from '../ui/entry/EntryPage'
import { NotFoundPage } from '../ui/NotFound'

export const publicRoutes = new Hono<AppEnv>()

async function loadGame(env: Env, publicId: string): Promise<Game | undefined> {
  return getGameByPublicId(getDb(env), publicId)
}

function baseUrl(env: Env): string {
  return env.APP_BASE_URL.replace(/\/$/, '')
}

// ---- Entry page ----
publicRoutes.get('/:publicId', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.html(<NotFoundPage />, 404)
  if (game.status !== 'open') return c.html(<EntryLockedPage game={game} />)
  return c.html(<EntryPage game={game} />)
})

// ---- Submit a score ----
publicRoutes.post('/:publicId/entries', async (c) => {
  const db = getDb(c.env)
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.html(<NotFoundPage />, 404)
  if (game.status !== 'open') return c.html(<EntryLockedPage game={game} />, 423)

  const body = await c.req.parseBody()
  const values: EntryFormValues = {
    name: typeof body.name === 'string' ? body.name : '',
    team: typeof body.team === 'string' ? body.team : '',
  }

  let name: string
  let team: string | null
  let strokes: number
  let holeStrokes: number[] | null = null

  if (game.entryMode === 'per_hole') {
    const holes = Array.from({ length: game.holes }, (_, i) =>
      typeof body[`hole_${i + 1}`] === 'string' ? (body[`hole_${i + 1}`] as string) : '',
    )
    values.holes = holes
    const parsed = perHoleEntrySchema(game.holes).safeParse({ ...values, holeStrokes: holes })
    if (!parsed.success) {
      return c.html(<EntryPage game={game} values={values} errors={fieldErrors(parsed.error)} />)
    }
    name = parsed.data.name
    team = parsed.data.team
    holeStrokes = parsed.data.holeStrokes
    strokes = holeStrokes.reduce((a, b) => a + b, 0)
  } else {
    values.strokes = typeof body.strokes === 'string' ? body.strokes : ''
    const parsed = totalEntrySchema.safeParse(values)
    if (!parsed.success) {
      return c.html(<EntryPage game={game} values={values} errors={fieldErrors(parsed.error)} />)
    }
    name = parsed.data.name
    team = parsed.data.team
    strokes = parsed.data.strokes
  }

  const entry = await createEntry(db, { gameId: game.id, name, team, strokes, holeStrokes })

  const entries = await listEntries(db, game.id)
  // Best-effort live broadcast; never fail the submission if realtime hiccups.
  try {
    await notifyBoard(c.env, game)
  } catch {
    /* boards recover via polling */
  }

  const standings = computeStandings(toRankable(entries))
  const placement = placementFor(standings, entry.id) ?? {
    rank: standings.length,
    total: standings.length,
    tied: false,
    placesAhead: 0,
  }
  return c.html(
    <EntrySuccessPage game={game} name={name} strokes={strokes} placement={placement} />,
  )
})

// ---- Live board page ----
publicRoutes.get('/:publicId/board', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.html(<NotFoundPage />, 404)
  const entries = await listEntries(getDb(c.env), game.id)
  // Sync the DO cache to D1 so the board's WS replay reflects the source of truth.
  try {
    await syncBoard(c.env, game)
  } catch {
    /* board still renders from D1 below */
  }
  return c.html(
    <BoardPage
      game={game}
      entries={toRankable(entries)}
      entryUrl={entryUrlFor(c.env, game.publicId)}
      updatedAt={Date.now()}
    />,
  )
})

// ---- Board state (JSON; polling fallback for the live client) ----
publicRoutes.get('/:publicId/board/state', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.json({ error: 'not_found' }, 404)
  const entries = await listEntries(getDb(c.env), game.id)
  const rows = diffStandings(null, computeStandings(toRankable(entries)))
  const updatedAt = Date.now()
  const rendered = renderStandings(rows, {
    entryUrl: entryUrlFor(c.env, game.publicId),
    updatedAt,
    locked: game.status !== 'open',
    perHole: game.entryMode === 'per_hole',
  })
  return c.json({
    type: 'standings',
    html: rendered.html,
    participants: rendered.participants,
    updatedAt,
  })
})

// ---- WebSocket upgrade -> GameRoom DO ----
publicRoutes.get('/:publicId/ws', async (c) => {
  if (c.req.header('upgrade') !== 'websocket') {
    return c.text('Expected WebSocket', 426)
  }
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  return gameRoom(c.env, game.publicId).fetch(c.req.raw)
})

// ---- QR (SVG) ----
publicRoutes.get('/:publicId/qr', async (c) => {
  const game = await loadGame(c.env, c.req.param('publicId'))
  if (!game) return c.text('not_found', 404)
  const target = c.req.query('target') === 'board' ? 'board' : 'entry'
  const url =
    target === 'board'
      ? `${baseUrl(c.env)}/g/${game.publicId}/board`
      : `${baseUrl(c.env)}/g/${game.publicId}`
  const svg = qrSvg(url, { module: 6 })
  return c.body(svg, 200, {
    'content-type': 'image/svg+xml; charset=utf-8',
    'cache-control': 'public, max-age=300',
  })
})
