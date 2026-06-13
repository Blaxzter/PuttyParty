import { raw } from 'hono/html'
import type { FC } from 'hono/jsx'
import type { Game } from '../../db/schema'
import { boardMeta } from '../../do/protocol'
import { computeStandings, diffStandings, type RankableEntry } from '../../lib/ranking'
import { Layout } from '../layout'
import { BrandBadge } from '../primitives'
import { renderStandings } from './standings'

const BOARD_CONFETTI = [
  { left: 47, w: 9, h: 14, color: '#F2C14E', round: '2px', dur: 3, delay: 0 },
  { left: 52, w: 10, h: 10, color: '#E2533B', round: '50%', dur: 3.4, delay: 0.6 },
  { left: 50, w: 9, h: 14, color: '#FFFDF8', round: '2px', dur: 2.8, delay: 1.1 },
]

export const BoardPage: FC<{
  game: Game
  entries: RankableEntry[]
  entryUrl: string
  updatedAt: number
}> = ({ game, entries, entryUrl, updatedAt }) => {
  const meta = boardMeta(game)
  const rows = diffStandings(null, computeStandings(entries))
  const rendered = renderStandings(rows, {
    entryUrl,
    updatedAt,
    locked: game.status !== 'open',
    perHole: game.entryMode === 'per_hole',
  })
  return (
    <Layout title={`${game.name} · Bestenliste`} bodyClass="pp-body--board" scripts={['/board.js']}>
      <div class="pp-board" data-public-id={game.publicId}>
        <div
          class={`pp-board-confetti${rows.length === 0 ? ' pp-board-confetti--hidden' : ''}`}
          aria-hidden="true"
        >
          {BOARD_CONFETTI.map((c) => (
            <span
              key={`${c.left}-${c.color}`}
              style={`position:absolute;left:${c.left}%;top:8%;width:${c.w}px;height:${c.h}px;background:${c.color};border-radius:${c.round};animation:pp-fall ${c.dur}s ease-in ${c.delay}s infinite`}
            />
          ))}
        </div>

        <div class="pp-board-top">
          <BrandBadge size={46} bg="rgba(255,253,248,0.12)" />
          <div class="pp-board-headline">
            <h1 class="pp-board-title">{meta.title}</h1>
            <div class="pp-board-sub">{meta.subtitle}</div>
          </div>
          <div class="pp-board-meta">
            <div class="pp-live">
              <span class="glow" />
              <span class="lbl">LIVE</span>
            </div>
            <div style="text-align:right">
              <div
                class="pp-score"
                id="pp-participants"
                style="font-size:clamp(20px,2vw,26px);line-height:1;color:#FFFDF8"
              >
                {rendered.participants}
              </div>
              <div class="pp-mono" style="font-size:10px;color:rgba(246,241,230,.6);margin-top:3px">
                Teilnehmer:innen
              </div>
            </div>
          </div>
        </div>

        <div id="pp-board-live" style="flex:1;display:flex;flex-direction:column;min-height:0">
          {raw(rendered.html)}
        </div>
      </div>
    </Layout>
  )
}
