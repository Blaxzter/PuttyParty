import { describe, expect, it } from 'vitest'
import {
  computeStandings,
  diffStandings,
  placementFor,
  type RankableEntry,
} from '../src/lib/ranking'

const e = (id: number, strokes: number, name = `P${id}`): RankableEntry => ({
  id,
  name,
  team: null,
  strokes,
})

describe('computeStandings', () => {
  it('returns [] for no entries', () => {
    expect(computeStandings([])).toEqual([])
  })

  it('ranks a single entry first', () => {
    const s = computeStandings([e(1, 42)])
    expect(s).toHaveLength(1)
    expect(s[0]!.rank).toBe(1)
    expect(s[0]!.tied).toBe(false)
  })

  it('uses competition ranking matching the design (35,37,38,41,43,43,46 -> 1,2,3,4,5,5,7)', () => {
    const standings = computeStandings([
      e(1, 35),
      e(2, 37),
      e(3, 38),
      e(4, 41),
      e(5, 43),
      e(6, 43),
      e(7, 46),
    ])
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5, 5, 7])
  })

  it('flags tied entries (geteilt) and only them', () => {
    const standings = computeStandings([e(1, 43), e(2, 35), e(3, 43), e(4, 46)])
    const byId = new Map(standings.map((s) => [s.entry.id, s]))
    expect(byId.get(2)!.tied).toBe(false) // 35, unique
    expect(byId.get(1)!.tied).toBe(true) // 43
    expect(byId.get(3)!.tied).toBe(true) // 43
    expect(byId.get(4)!.tied).toBe(false) // 46, unique
  })

  it('breaks ties deterministically by id (earliest submission first)', () => {
    const standings = computeStandings([e(9, 40), e(2, 40), e(5, 40)])
    expect(standings.map((s) => s.entry.id)).toEqual([2, 5, 9])
    expect(standings.every((s) => s.rank === 1)).toBe(true)
  })

  it('does not mutate its input', () => {
    const input = [e(1, 50), e(2, 30)]
    const copy = [...input]
    computeStandings(input)
    expect(input).toEqual(copy)
  })
})

describe('diffStandings', () => {
  it('marks every entry new when there is no previous snapshot', () => {
    const next = computeStandings([e(1, 40), e(2, 50)])
    const rows = diffStandings(null, next)
    expect(rows.every((r) => r.movement.dir === 'new')).toBe(true)
  })

  it('computes up/down/same vs a previous snapshot', () => {
    const prev = computeStandings([e(1, 40), e(2, 41), e(3, 42)]) // ranks 1,2,3
    // entry 3 improves to 39 -> now rank 1; entry 1 -> rank 2; entry 2 -> rank 3
    const next = computeStandings([e(1, 40), e(2, 41), e(3, 39)])
    const rows = diffStandings(prev, next)
    const byId = new Map(rows.map((r) => [r.entry.id, r]))
    expect(byId.get(3)!.movement).toEqual({ dir: 'up', places: 2 })
    expect(byId.get(1)!.movement).toEqual({ dir: 'down', places: 1 })
    expect(byId.get(2)!.movement).toEqual({ dir: 'down', places: 1 })
  })

  it('reports same when rank is unchanged', () => {
    const prev = computeStandings([e(1, 40), e(2, 50)])
    const next = computeStandings([e(1, 40), e(2, 50)])
    const rows = diffStandings(prev, next)
    expect(rows.every((r) => r.movement.dir === 'same')).toBe(true)
  })
})

describe('placementFor', () => {
  it('reports rank, total, tie and places-ahead for the success screen', () => {
    const standings = computeStandings([e(1, 35), e(2, 38), e(3, 38), e(4, 46)])
    const p = placementFor(standings, 2)!
    expect(p.rank).toBe(2)
    expect(p.total).toBe(4)
    expect(p.tied).toBe(true) // shares rank 2 with entry 3
    expect(p.placesAhead).toBe(1) // only entry 4 (46) is behind
  })

  it('returns null for an unknown entry', () => {
    const standings = computeStandings([e(1, 35)])
    expect(placementFor(standings, 999)).toBeNull()
  })

  it('reports 0 places ahead for last place', () => {
    const standings = computeStandings([e(1, 35), e(2, 60)])
    expect(placementFor(standings, 2)!.placesAhead).toBe(0)
  })
})
