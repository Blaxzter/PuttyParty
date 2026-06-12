// Pure ranking logic. Lower strokes are better.
//
// Ranking is STANDARD COMPETITION ranking (1-2-2-4): tied entries share the
// lower rank and the next rank skips accordingly — this matches the design,
// whose board shows ranks 4, 5, 5, 7 for scores 41, 43, 43, 46.

export interface RankableEntry {
  id: number
  name: string
  team: string | null
  strokes: number
}

export interface Standing {
  entry: RankableEntry
  rank: number
  /** True when this entry shares its rank with at least one other (the "geteilt" badge). */
  tied: boolean
}

export type MovementDir = 'up' | 'down' | 'same' | 'new'

export interface Movement {
  dir: MovementDir
  places: number
}

export interface RankedRow extends Standing {
  movement: Movement
}

/**
 * Computes competition-ranked standings. Input order is irrelevant; entries are
 * sorted by strokes ascending, ties broken by id ascending (earliest first).
 */
export function computeStandings(input: RankableEntry[]): Standing[] {
  const sorted = [...input].sort((a, b) => a.strokes - b.strokes || a.id - b.id)
  const standings: Standing[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j < sorted.length && sorted[j]!.strokes === sorted[i]!.strokes) j++
    const rank = i + 1 // competition rank = 1 + (entries with strictly fewer strokes)
    const tied = j - i > 1
    for (let k = i; k < j; k++) standings.push({ entry: sorted[k]!, rank, tied })
    i = j
  }
  return standings
}

/**
 * Annotates next-standings with movement vs a previous snapshot.
 * `up` means the entry climbed (rank decreased). Unknown ids are `new`.
 */
export function diffStandings(prev: Standing[] | null, next: Standing[]): RankedRow[] {
  const prevRank = new Map<number, number>()
  if (prev) for (const s of prev) prevRank.set(s.entry.id, s.rank)
  return next.map((s) => {
    const before = prevRank.get(s.entry.id)
    let movement: Movement
    if (before === undefined) movement = { dir: 'new', places: 0 }
    else if (before > s.rank) movement = { dir: 'up', places: before - s.rank }
    else if (before < s.rank) movement = { dir: 'down', places: s.rank - before }
    else movement = { dir: 'same', places: 0 }
    return { ...s, movement }
  })
}

export interface Placement {
  rank: number
  total: number
  tied: boolean
  /** How many players this entry now ranks ahead of (for the success "▲ X Plätze"). */
  placesAhead: number
}

/** Placement of a single entry within standings (for the entry success screen). */
export function placementFor(standings: Standing[], entryId: number): Placement | null {
  const s = standings.find((x) => x.entry.id === entryId)
  if (!s) return null
  const placesAhead = standings.filter((x) => x.entry.strokes > s.entry.strokes).length
  return { rank: s.rank, total: standings.length, tied: s.tied, placesAhead }
}
