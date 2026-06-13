import { describe, expect, it } from 'vitest'
import { computeStandings, diffStandings, type RankableEntry } from '../src/lib/ranking'
import { renderStandings } from '../src/ui/board/standings'

const e = (id: number, strokes: number): RankableEntry => ({
  id,
  name: `P${id}`,
  team: null,
  strokes,
})

const eh = (id: number, holeStrokes: number[]): RankableEntry => ({
  id,
  name: `P${id}`,
  team: null,
  strokes: holeStrokes.reduce((a, b) => a + b, 0),
  holeStrokes,
})

const rowsOf = (...entries: RankableEntry[]) => diffStandings(null, computeStandings(entries))
const OPTS = { entryUrl: 'https://example.test/g/abc', updatedAt: 1_700_000_000_000 }

describe('renderStandings — QR vs locked', () => {
  it('shows the QR and entry CTA while the game is open', () => {
    const { html } = renderStandings(rowsOf(e(1, 40), e(2, 50)), OPTS)
    expect(html).toContain('pp-qr')
    expect(html).toContain('Scan')
    expect(html).toContain('pp-board-cta')
  })

  it('replaces the QR with a closed hint and drops the CTA when locked', () => {
    const { html } = renderStandings(rowsOf(e(1, 40), e(2, 50)), { ...OPTS, locked: true })
    expect(html).not.toContain('pp-qr')
    expect(html).not.toContain('pp-board-cta')
    expect(html).toContain('geschlossen')
  })

  it('honors locked on the empty board too', () => {
    const open = renderStandings([], OPTS)
    expect(open.html).toContain('pp-qr')
    expect(open.html).toContain('pp-board-cta')

    const locked = renderStandings([], { ...OPTS, locked: true })
    expect(locked.html).not.toContain('pp-qr')
    expect(locked.html).not.toContain('pp-board-cta')
    expect(locked.html).toContain('geschlossen')
  })
})

describe('renderStandings — per-hole scorecards', () => {
  it('omits scorecards entirely unless perHole is set', () => {
    const { html } = renderStandings(rowsOf(eh(1, [3, 4, 5]), eh(2, [4, 4, 4])), OPTS)
    expect(html).not.toContain('pp-scorecard')
    expect(html).not.toContain('pp-row--exp')
    expect(html).not.toContain('pp-podium-card--exp')
  })

  it('renders an expandable scorecard for podium and list rows when perHole', () => {
    // 4 entries -> 3 on the podium, 1 in the list.
    const { html } = renderStandings(
      rowsOf(eh(1, [3, 4, 5]), eh(2, [4, 4, 4]), eh(3, [5, 5, 5]), eh(4, [6, 6, 6])),
      { ...OPTS, perHole: true },
    )
    expect(html).toContain('pp-podium-card--exp')
    expect(html).toContain('pp-row--exp')
    expect(html).toContain('aria-expanded="false"')
    // Hole strokes + total (Σ) cells are present.
    expect(html).toContain('pp-sc-cell--total')
    expect(html).toContain('<b>Σ</b><i>12</i>') // first place 3+4+5
  })

  it('leaves a per-hole entry without stored holes non-expandable', () => {
    const { html } = renderStandings(rowsOf(e(1, 40), e(2, 50)), { ...OPTS, perHole: true })
    expect(html).not.toContain('pp-row--exp')
    expect(html).not.toContain('pp-scorecard')
  })
})
