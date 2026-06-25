import { describe, expect, it } from 'vitest'
import type { Game } from '../src/db/schema'
import { boardMeta, toRankable } from '../src/do/protocol'

const game = (over: Partial<Game> = {}): Game => ({
  id: 1,
  publicId: 'abc',
  manageId: 'mng',
  name: 'Sommerfest',
  date: '2026-06-13',
  location: 'Gemeindewiese',
  holes: 9,
  maxStrokesPerHole: null,
  pickupPenalty: 1,
  entryMode: 'total',
  teamsEnabled: true,
  status: 'open',
  locale: 'de',
  createdAt: 0,
  updatedAt: 0,
  ...over,
})

describe('boardMeta', () => {
  it('omits the "Bahn 1–N" range for total-entry games', () => {
    expect(boardMeta(game({ entryMode: 'total' }), 'de').subtitle).not.toContain('Bahn')
  })

  it('includes the "Bahn 1–N" range for per-hole games', () => {
    expect(boardMeta(game({ entryMode: 'per_hole', holes: 18 }), 'de').subtitle).toContain(
      'Bahn 1–18',
    )
  })

  it('drops a missing location without leaving a stray separator', () => {
    const sub = boardMeta(game({ location: null }), 'de').subtitle
    expect(sub).not.toMatch(/^ · | · $|· ·/)
  })
})

describe('toRankable', () => {
  const base = {
    gameId: 1,
    name: 'A',
    team: null,
    createdAt: 0,
    updatedAt: 0,
  }

  it('parses stored per-hole JSON into a number array', () => {
    const [r] = toRankable([{ id: 1, strokes: 12, holeStrokes: '[3,4,5]', ...base }])
    expect(r?.holeStrokes).toEqual([3, 4, 5])
  })

  it('yields null hole strokes for total entries and malformed JSON', () => {
    const [a, b] = toRankable([
      { id: 1, strokes: 40, holeStrokes: null, ...base },
      { id: 2, strokes: 40, holeStrokes: 'not json', ...base },
    ])
    expect(a?.holeStrokes).toBeNull()
    expect(b?.holeStrokes).toBeNull()
  })
})
