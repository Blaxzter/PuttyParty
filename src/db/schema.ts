import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const epochMs = sql`(unixepoch('subsec') * 1000)`

export const games = sqliteTable(
  'games',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Opaque, unguessable id used in public URLs. */
    publicId: text('public_id').notNull(),
    /** Secret capability token for self-service management (/m/<token>). */
    manageId: text('manage_id'),
    name: text('name').notNull(),
    /** ISO date (YYYY-MM-DD); rendered as DD.MM.YYYY. */
    date: text('date').notNull(),
    location: text('location'),
    holes: integer('holes').notNull().default(9),
    /**
     * Optional per-hole stroke cap (per_hole games). After this many strokes the
     * ball is picked up; NULL = no limit. The highest value recordable on a hole
     * is `maxStrokesPerHole + pickupPenalty`.
     */
    maxStrokesPerHole: integer('max_strokes_per_hole'),
    /** Strokes added when the ball is picked up at the limit (classic rule: 1). */
    pickupPenalty: integer('pickup_penalty').notNull().default(1),
    /** 'total' = single Gesamtschläge input; 'per_hole' = per-Bahn grid summed. */
    entryMode: text('entry_mode', { enum: ['total', 'per_hole'] })
      .notNull()
      .default('total'),
    teamsEnabled: integer('teams_enabled', { mode: 'boolean' }).notNull().default(true),
    status: text('status', { enum: ['open', 'locked', 'archived'] })
      .notNull()
      .default('open'),
    /** Language the board + entry page render in (chosen at creation). */
    locale: text('locale', { enum: ['de', 'en'] })
      .notNull()
      .default('de'),
    createdAt: integer('created_at').notNull().default(epochMs),
    updatedAt: integer('updated_at').notNull().default(epochMs),
  },
  (t) => [
    uniqueIndex('idx_games_public_id').on(t.publicId),
    uniqueIndex('idx_games_manage_id').on(t.manageId),
  ],
)

export const entries = sqliteTable(
  'entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    team: text('team'),
    /** Canonical total strokes — the value ranking uses (lower is better). */
    strokes: integer('strokes').notNull(),
    /** JSON array of per-hole strokes, set only for per_hole games. */
    holeStrokes: text('hole_strokes'),
    createdAt: integer('created_at').notNull().default(epochMs),
    updatedAt: integer('updated_at').notNull().default(epochMs),
  },
  (t) => [index('idx_entries_game_strokes').on(t.gameId, t.strokes)],
)

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type Entry = typeof entries.$inferSelect
export type NewEntry = typeof entries.$inferInsert
