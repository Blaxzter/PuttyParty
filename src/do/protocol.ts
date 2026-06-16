import type { Entry, Game } from '../db/schema'
import { getDictionary } from '../i18n'
import type { Locale } from '../i18n/locale'
import { formatLongDate } from '../lib/dates'
import type { RankableEntry } from '../lib/ranking'

/** Static board chrome (title + subtitle); not part of the live region. */
export interface BoardMeta {
  publicId: string
  title: string
  subtitle: string
}

/** Message the DO pushes to every connected board over the WebSocket. */
export interface StandingsMessage {
  type: 'standings'
  /** Inner HTML of #pp-board-live. */
  html: string
  participants: number
  updatedAt: number
}

export function toRankable(entries: Entry[]): RankableEntry[] {
  return entries.map((e) => ({
    id: e.id,
    name: e.name,
    team: e.team,
    strokes: e.strokes,
    holeStrokes: parseHoleStrokes(e.holeStrokes),
  }))
}

/** Safely parses the stored JSON per-hole array; returns null if absent/malformed. */
function parseHoleStrokes(raw: string | null): number[] | null {
  if (!raw) return null
  try {
    const v: unknown = JSON.parse(raw)
    if (Array.isArray(v) && v.every((n) => typeof n === 'number')) return v as number[]
  } catch {
    /* malformed — fall through */
  }
  return null
}

export function boardMeta(game: Game, locale: Locale): BoardMeta {
  // The hole range only makes sense for per-hole games; a total-entry game just
  // has a single total input, so the range would be misleading there.
  const t = getDictionary(locale)
  const parts = [game.location, formatLongDate(game.date, locale)]
  if (game.entryMode === 'per_hole') parts.push(t.board.bahnRange(game.holes))
  return {
    publicId: game.publicId,
    title: game.name,
    subtitle: parts.filter((p): p is string => Boolean(p)).join(' · '),
  }
}
