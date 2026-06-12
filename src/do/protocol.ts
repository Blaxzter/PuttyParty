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
  return entries.map((e) => ({ id: e.id, name: e.name, team: e.team, strokes: e.strokes }))
}

export function boardMeta(game: Game): BoardMeta {
  const parts = [game.location, formatGermanLong(game.date), `Bahn 1–${game.holes}`].filter(
    (p): p is string => Boolean(p),
  )
  return { publicId: game.publicId, title: game.name, subtitle: parts.join(' · ') }
}
