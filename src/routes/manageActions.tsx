import type { Context } from 'hono'
import type { AppEnv } from '../bindings'
import {
  createEntry,
  deleteEntry,
  deleteGame,
  getDb,
  listEntries,
  resetEntries,
  updateEntry,
  updateGame,
} from '../db/queries'
import type { Game } from '../db/schema'
import { adminEntrySchema, createGameSchema, fieldErrors } from '../lib/validation'
import { notifyBoard } from '../realtime'
import { EntriesTable, type RowDraft } from '../ui/admin/EntriesTable'
import { GameFormBody, type GameFormValues } from '../ui/admin/GameForm'
import { StatusToggle } from '../ui/admin/Manage'

type Ctx = Context<AppEnv>

/** Redirect targets that differ between org admin and self-service. */
export interface ManageTargets {
  basePath: string
  onArchive: string
  onDelete: string
}

export const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function draftFromBody(body: Record<string, unknown>): GameFormValues {
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

async function renderEntries(
  c: Ctx,
  game: Game,
  basePath: string,
  opts: {
    editId?: number
    addMode?: boolean
    draft?: RowDraft
    errors?: Record<string, string>
  } = {},
) {
  const entries = await listEntries(getDb(c.env), game.id)
  return c.html(<EntriesTable game={game} entries={entries} basePath={basePath} {...opts} />)
}

async function broadcast(c: Ctx, game: Game): Promise<void> {
  try {
    await notifyBoard(c.env, game)
  } catch {
    /* boards recover via polling */
  }
}

// ---- Entry actions (shared) ----

export function getEntriesPartial(c: Ctx, game: Game, basePath: string) {
  const editParam = c.req.query('edit')
  const editId = editParam ? Number(editParam) : undefined
  return renderEntries(c, game, basePath, {
    editId: editId !== undefined && Number.isFinite(editId) ? editId : undefined,
    addMode: c.req.query('add') === '1',
  })
}

export async function addEntry(c: Ctx, game: Game, basePath: string) {
  const body = await c.req.parseBody()
  const parsed = adminEntrySchema.safeParse(body)
  if (!parsed.success) {
    return renderEntries(c, game, basePath, {
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
  return renderEntries(c, game, basePath)
}

export async function editEntry(c: Ctx, game: Game, entryId: number, basePath: string) {
  const body = await c.req.parseBody()
  const parsed = adminEntrySchema.safeParse(body)
  if (!parsed.success) {
    return renderEntries(c, game, basePath, {
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
  return renderEntries(c, game, basePath)
}

export async function removeEntry(c: Ctx, game: Game, entryId: number, basePath: string) {
  await deleteEntry(getDb(c.env), game.id, entryId)
  await broadcast(c, game)
  return renderEntries(c, game, basePath)
}

export async function resetAllEntries(c: Ctx, game: Game, basePath: string) {
  await resetEntries(getDb(c.env), game.id)
  await broadcast(c, game)
  return renderEntries(c, game, basePath)
}

// ---- Game actions (shared) ----

/** Handles the edit-settings modal submit AND the status toggle / archive. */
export async function updateGameSettingsOrStatus(c: Ctx, game: Game, targets: ManageTargets) {
  const db = getDb(c.env)
  const body = await c.req.parseBody()

  // Full settings edit (the modal submits a `name`); the status toggle does not.
  if (typeof body.name === 'string') {
    const parsed = createGameSchema.safeParse(body)
    if (!parsed.success) {
      return c.html(
        <GameFormBody
          mode="edit"
          game={game}
          basePath={targets.basePath}
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
    // The edit modal can flip status, so refresh live boards (QR ↔ closed hint).
    await broadcast(c, game)
    c.header('HX-Redirect', targets.basePath)
    return c.body(null, 200)
  }

  const next = str(body.status)
  if (next !== 'open' && next !== 'locked' && next !== 'archived') {
    return c.text('bad_request', 400)
  }
  const updated = (await updateGame(db, game.publicId, { status: next })) ?? game
  // Push the status change to any live board so the QR/CTA appears or disappears.
  await broadcast(c, updated)
  if (next === 'archived') {
    c.header('HX-Redirect', targets.onArchive)
    return c.body(null, 200)
  }
  return c.html(<StatusToggle game={updated} basePath={targets.basePath} />)
}

export async function removeGame(c: Ctx, game: Game, targets: ManageTargets) {
  await deleteGame(getDb(c.env), game.id)
  c.header('HX-Redirect', targets.onDelete)
  return c.body(null, 200)
}
