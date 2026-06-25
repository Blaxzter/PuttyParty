import { asc, desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import type { Env } from '../bindings'
import type { Locale } from '../i18n/locale'
import { type Entry, entries, type Game, games, type NewEntry } from './schema'

export type Db = ReturnType<typeof getDb>

export function getDb(env: Env) {
  return drizzle(env.DB)
}

export interface GameWithCount extends Game {
  entryCount: number
}

/** All games (newest first) with their participant counts — for the dashboard. */
export async function listGamesWithCounts(db: Db): Promise<GameWithCount[]> {
  const rows = await db
    .select({
      ...getTableColumns(games),
      entryCount: sql<number>`count(${entries.id})`,
    })
    .from(games)
    .leftJoin(entries, eq(entries.gameId, games.id))
    .groupBy(games.id)
    .orderBy(desc(games.createdAt))
  return rows
}

export async function getGameByPublicId(db: Db, publicId: string): Promise<Game | undefined> {
  const [row] = await db.select().from(games).where(eq(games.publicId, publicId)).limit(1)
  return row
}

export async function getGameByManageId(db: Db, manageId: string): Promise<Game | undefined> {
  const [row] = await db.select().from(games).where(eq(games.manageId, manageId)).limit(1)
  return row
}

export async function countEntries(db: Db, gameId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(entries)
    .where(eq(entries.gameId, gameId))
  return row?.n ?? 0
}

/** Entries for a game, ordered for ranking: lowest strokes first, earliest submission breaks ties. */
export async function listEntries(db: Db, gameId: number): Promise<Entry[]> {
  return db
    .select()
    .from(entries)
    .where(eq(entries.gameId, gameId))
    .orderBy(asc(entries.strokes), asc(entries.createdAt), asc(entries.id))
}

export type CreateGameInput = {
  publicId: string
  manageId: string
  name: string
  date: string
  location: string | null
  holes: number
  /** Per-hole stroke cap; null = no limit. */
  maxStrokesPerHole?: number | null
  /** Strokes added on pickup at the cap (defaults to 1). */
  pickupPenalty?: number
  entryMode: 'total' | 'per_hole'
  teamsEnabled: boolean
  status: 'open' | 'locked'
  locale: Locale
}

export async function createGame(db: Db, input: CreateGameInput): Promise<Game> {
  const now = Date.now()
  const [row] = await db
    .insert(games)
    .values({
      ...input,
      maxStrokesPerHole: input.maxStrokesPerHole ?? null,
      pickupPenalty: input.pickupPenalty ?? 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return row as Game
}

export type UpdateGamePatch = Partial<{
  name: string
  date: string
  location: string | null
  holes: number
  maxStrokesPerHole: number | null
  pickupPenalty: number
  entryMode: 'total' | 'per_hole'
  teamsEnabled: boolean
  status: 'open' | 'locked' | 'archived'
  locale: Locale
}>

export async function updateGame(
  db: Db,
  publicId: string,
  patch: UpdateGamePatch,
): Promise<Game | undefined> {
  const [row] = await db
    .update(games)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(games.publicId, publicId))
    .returning()
  return row
}

/** Deletes a game and its entries (manual cascade — D1 does not enforce FKs by default). */
export async function deleteGame(db: Db, gameId: number): Promise<void> {
  await db.delete(entries).where(eq(entries.gameId, gameId))
  await db.delete(games).where(eq(games.id, gameId))
}

export type CreateEntryInput = {
  gameId: number
  name: string
  team: string | null
  strokes: number
  holeStrokes: number[] | null
}

export async function createEntry(db: Db, input: CreateEntryInput): Promise<Entry> {
  const now = Date.now()
  const values: NewEntry = {
    gameId: input.gameId,
    name: input.name,
    team: input.team,
    strokes: input.strokes,
    holeStrokes: input.holeStrokes ? JSON.stringify(input.holeStrokes) : null,
    createdAt: now,
    updatedAt: now,
  }
  const [row] = await db.insert(entries).values(values).returning()
  return row as Entry
}

export type UpdateEntryPatch = Partial<{
  name: string
  team: string | null
  strokes: number
  holeStrokes: number[] | null
}>

export async function updateEntry(
  db: Db,
  gameId: number,
  entryId: number,
  patch: UpdateEntryPatch,
): Promise<Entry | undefined> {
  const set: Record<string, unknown> = { updatedAt: Date.now() }
  if (patch.name !== undefined) set.name = patch.name
  if (patch.team !== undefined) set.team = patch.team
  if (patch.strokes !== undefined) set.strokes = patch.strokes
  if (patch.holeStrokes !== undefined)
    set.holeStrokes = patch.holeStrokes ? JSON.stringify(patch.holeStrokes) : null
  const [row] = await db
    .update(entries)
    .set(set)
    .where(sql`${entries.id} = ${entryId} AND ${entries.gameId} = ${gameId}`)
    .returning()
  return row
}

export async function deleteEntry(db: Db, gameId: number, entryId: number): Promise<void> {
  await db.delete(entries).where(sql`${entries.id} = ${entryId} AND ${entries.gameId} = ${gameId}`)
}

export async function resetEntries(db: Db, gameId: number): Promise<void> {
  await db.delete(entries).where(eq(entries.gameId, gameId))
}
