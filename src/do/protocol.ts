import type { Entry, Game } from '../db/schema'
import { formatGermanLong } from '../lib/dates'
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

export function boardMeta(game: Game): BoardMeta {
  // "Bahn 1–N" only makes sense for per-hole games; a total-entry game just has
  // a single Gesamtschläge input, so the hole range is misleading there.
  const parts = [game.location, formatGermanLong(game.date)]
  if (game.entryMode === 'per_hole') parts.push(`Bahn 1–${game.holes}`)
  return {
    publicId: game.publicId,
    title: game.name,
    subtitle: parts.filter((p): p is string => Boolean(p)).join(' · '),
  }
}
