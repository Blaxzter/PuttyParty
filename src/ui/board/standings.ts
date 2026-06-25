import type { Dictionary } from '../../i18n'
import { qrSvg } from '../../lib/qr'
import type { RankedRow } from '../../lib/ranking'
import { medalColor } from '../tokens'

// Plain HTML-string renderer for the live board region (#pp-board-live). Used by
// the initial server render, the JSON state endpoint, AND the GameRoom DO
// broadcast, so all three are byte-identical. User text is HTML-escaped here
// (no JSX auto-escape in raw strings). All board copy comes from the game's
// locale dictionary (passed in as `t`), since the rendered HTML is shared across
// every connected screen.

type Board = Dictionary['board']

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c] ?? c)
}

export interface StandingsRenderOpts {
  /** Absolute URL to the entry page, encoded in the board's QR. */
  entryUrl: string
  updatedAt: number
  /** Board copy in the game's language. */
  t: Board
  /**
   * When the game isn't accepting entries (status !== 'open'), the QR + CTA are
   * replaced with a "closed" hint — scanning would otherwise dead-end on the
   * locked entry page.
   */
  locked?: boolean
  /**
   * Per-hole game: rows and podium cards become tappable to reveal each player's
   * per-hole scorecard. No-op for entries without stored hole strokes.
   */
  perHole?: boolean
}

export interface RenderedStandings {
  html: string
  participants: number
}

/** Renders the full inner HTML of #pp-board-live for the given ranked rows. */
export function renderStandings(rows: RankedRow[], opts: StandingsRenderOpts): RenderedStandings {
  const { t } = opts
  const perHole = !!opts.perHole
  // Mobile-only CTA: on the phone showing the board, the QR is useless, so the
  // design swaps it for a direct entry link (hidden on the big screen via CSS).
  // Dropped when locked — there's nowhere useful to send the tap.
  const cta = opts.locked
    ? ''
    : `<a class="pp-board-cta" href="${esc(opts.entryUrl)}">${esc(t.ctaOwnScore)}</a>`

  if (rows.length === 0) {
    const aside = opts.locked
      ? lockedAside(opts.updatedAt, t)
      : qrAside(opts.entryUrl, opts.updatedAt, t)
    return {
      html: `<div class="pp-board-body pp-board-body--empty">${renderEmpty(t)}${aside}</div>${cta}`,
      participants: 0,
    }
  }

  const podiumInner = renderPodium(rows.slice(0, 3), perHole, t)

  // 1–3 players: there's no leaderboard list yet, so skip the empty list panel
  // and make the podium the hero — centered on the turf with a prominent join
  // card — instead of a lone tile floating above a big empty box. The server
  // re-renders to the list layout below as soon as a 4th player joins.
  if (rows.length <= 3) {
    const join = opts.locked
      ? joinPanelLocked(opts.updatedAt, t)
      : joinPanelQr(opts.entryUrl, opts.updatedAt, t)
    // --n{1,2,3} lets the mobile fallback widen the cards when there are fewer
    // than three (33%-wide cards only read well as a full podium row).
    const showcase =
      `<div class="pp-board-showcase">` +
      `<div class="pp-podium pp-podium--show pp-podium--n${rows.length}" id="pp-podium">${podiumInner}</div>` +
      join +
      `</div>`
    return { html: showcase + cta, participants: rows.length }
  }

  const aside = opts.locked
    ? lockedAside(opts.updatedAt, t)
    : qrAside(opts.entryUrl, opts.updatedAt, t)
  const podium = `<div class="pp-podium" id="pp-podium">${podiumInner}</div>`
  const body =
    `<div class="pp-board-body">` +
    `<div class="pp-board-list" id="pp-list">${renderList(rows.slice(3), perHole, t)}</div>` +
    aside +
    `</div>`
  return { html: podium + body + cta, participants: rows.length }
}

function ballHtml(size: number): string {
  return `<span class="pp-ball" style="width:${size}px;height:${size}px"></span>`
}

function flagHtml(size: number): string {
  const poleW = Math.max(2, size * 0.14)
  return (
    `<span style="position:relative;display:inline-flex;width:${size}px;height:${size}px">` +
    `<span style="position:absolute;left:${size * 0.29}px;top:0;width:${poleW}px;height:${size * 0.93}px;background:#16261F;border-radius:1px"></span>` +
    `<span style="position:absolute;left:${size * 0.43}px;top:0;width:${size * 0.57}px;height:${size * 0.43}px;background:#E2533B;clip-path:polygon(0 0,100% 50%,0 100%);transform-origin:left center;animation:pp-wave 2.4s ease-in-out infinite"></span>` +
    `</span>`
  )
}

// Per-hole scorecard strip, shown when a per_hole row/card is expanded. Each
// cell is a hole number over its strokes; the last cell is the total (Σ).
// Returns '' for entries with no stored per-hole data (e.g. a total entry).
function scorecardHtml(holeStrokes: number[] | null | undefined, total: number): string {
  if (!holeStrokes || holeStrokes.length === 0) return ''
  const cells = holeStrokes
    .map((s, i) => `<span class="pp-sc-cell"><b>${i + 1}</b><i>${s}</i></span>`)
    .join('')
  return (
    `<div class="pp-scorecard">` +
    cells +
    `<span class="pp-sc-cell pp-sc-cell--total"><b>Σ</b><i>${total}</i></span>` +
    `</div>`
  )
}

function podiumCard(row: RankedRow, isFirst: boolean, perHole: boolean, t: Board): string {
  const chipSize = isFirst ? 52 : 44
  const chipFont = isFirst ? 24 : 20
  const scoreFont = isFirst ? 62 : 46
  const color = medalColor(row.rank)
  const accent = isFirst ? 'color:var(--pp-turf-to);' : ''
  const flag = isFirst
    ? `<span style="position:absolute;left:50%;top:-34px;transform:translateX(-50%)">${flagHtml(34)}</span>`
    : ''
  const team = row.entry.team
    ? `<div class="pp-podium-team">${esc(row.entry.team)}</div>`
    : '<div class="pp-podium-team">&nbsp;</div>'
  const card = perHole ? scorecardHtml(row.entry.holeStrokes, row.entry.strokes) : ''
  const cls =
    'pp-podium-card' +
    (isFirst ? ' pp-podium-card--first' : '') +
    (card ? ' pp-podium-card--exp' : '')
  const a11y = card ? ' role="button" tabindex="0" aria-expanded="false"' : ''
  return (
    `<div class="${cls}" data-entry-id="${row.entry.id}"${a11y}>` +
    flag +
    `<div class="pp-rank-chip" style="width:${chipSize}px;height:${chipSize}px;background:${color};font-size:${chipFont}px;margin-bottom:10px">${row.rank}</div>` +
    `<div class="pp-podium-name" style="${accent}">${esc(row.entry.name)}</div>` +
    team +
    `<div class="pp-podium-score" style="${accent}font-size:${scoreFont}px" data-role="score">${row.entry.strokes}</div>` +
    `<div class="pp-podium-unit">${esc(t.strokesUnit)}</div>` +
    card +
    `</div>`
  )
}

function renderPodium(top: RankedRow[], perHole: boolean, t: Board): string {
  const first = top[0]
  const second = top[1]
  const third = top[2]
  const cards: string[] = []
  if (second) cards.push(podiumCard(second, false, perHole, t))
  if (first) cards.push(podiumCard(first, true, perHole, t))
  if (third) cards.push(podiumCard(third, false, perHole, t))
  return cards.join('')
}

function moveHtml(row: RankedRow): string {
  if (row.movement.dir === 'up')
    return `<span class="pp-move pp-move--up">▲${row.movement.places}</span>`
  if (row.movement.dir === 'down')
    return `<span class="pp-move pp-move--down">▼${row.movement.places}</span>`
  return ''
}

function listRow(row: RankedRow, perHole: boolean, t: Board): string {
  const team = row.entry.team ? `<span class="pp-row-team">${esc(row.entry.team)}</span>` : ''
  const tie = row.tied ? `<span class="pp-tie">${esc(t.tied)}</span>` : ''
  const card = perHole ? scorecardHtml(row.entry.holeStrokes, row.entry.strokes) : ''
  // Expandable only when there's a scorecard to reveal; plain row otherwise.
  const cls = card ? 'pp-row pp-row--exp' : 'pp-row'
  const a11y = card ? ' role="button" tabindex="0" aria-expanded="false"' : ''
  const caret = card ? '<span class="pp-row-caret" aria-hidden="true">▾</span>' : ''
  const detail = card ? `<div class="pp-row-card">${card}</div>` : ''
  return (
    `<div class="${cls}" data-entry-id="${row.entry.id}"${a11y}>` +
    `<span class="pp-row-rank">${row.rank}</span>` +
    ballHtml(14) +
    `<span class="pp-row-name">${esc(row.entry.name)}</span>` +
    team +
    tie +
    moveHtml(row) +
    `<span class="pp-row-score" data-role="score">${row.entry.strokes}</span>` +
    caret +
    detail +
    `</div>`
  )
}

function renderList(rest: RankedRow[], perHole: boolean, t: Board): string {
  return rest.map((r) => listRow(r, perHole, t)).join('')
}

function updatedHtml(updatedAt: number, t: Board): string {
  return `<div class="pp-mono pp-updated" data-ts="${updatedAt}" style="font-size:10px;color:rgba(246,241,230,.6);margin-top:4px">${esc(t.updatedPrefix + t.justNow)}</div>`
}

function qrAside(entryUrl: string, updatedAt: number, t: Board): string {
  return (
    `<div class="pp-board-aside">` +
    `<div class="pp-qr" style="width:132px;height:132px;padding:11px;border-radius:14px">${qrSvg(entryUrl, { module: 4 })}</div>` +
    `<div class="pp-h" style="font-weight:700;font-size:14px;color:#FFFDF8;margin-top:12px">${esc(t.scanToPlay)}</div>` +
    updatedHtml(updatedAt, t) +
    `</div>`
  )
}

// Padlock glyph used by both the locked aside and the locked showcase join card.
function lockGlyph(): string {
  return (
    `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<rect x="4" y="10.5" width="16" height="10.5" rx="2.4" fill="#16261F"/>` +
    `<path d="M7.3 10.5V7.4a4.7 4.7 0 0 1 9.4 0v3.1" stroke="#16261F" stroke-width="2.2" fill="none"/>` +
    `<circle cx="12" cy="15.2" r="1.7" fill="#FFFDF8"/>` +
    `</svg>`
  )
}

// Shown in place of the QR when the game is locked/archived. Mirrors the QR
// box's footprint so the board layout doesn't shift when toggling status. Does
// NOT reuse the `.pp-qr` class — its `svg { width:100% }` rule would blow up the
// little lock glyph.
function lockedAside(updatedAt: number, t: Board): string {
  return (
    `<div class="pp-board-aside">` +
    `<div style="width:132px;height:132px;box-sizing:border-box;padding:14px;border-radius:14px;background:var(--pp-card);box-shadow:0 8px 20px rgba(0,0,0,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">` +
    lockGlyph() +
    `<div class="pp-h" style="font-weight:700;font-size:13px;color:var(--pp-ink);text-align:center;line-height:1.25">${esc(t.lockedAsideLine1)}<br>${esc(t.lockedAsideLine2)}</div>` +
    `</div>` +
    updatedHtml(updatedAt, t).replace('margin-top:4px', 'margin-top:12px') +
    `</div>`
  )
}

// Horizontal join card for the 1–3 player showcase: a big QR next to the
// "scan to play" prompt. Fills the space the leaderboard list would occupy and
// doubles as the call-to-action to get more players onto the board.
function joinPanelQr(entryUrl: string, updatedAt: number, t: Board): string {
  return (
    `<div class="pp-board-join">` +
    `<div class="pp-qr pp-board-join-qr">${qrSvg(entryUrl, { module: 4 })}</div>` +
    `<div class="pp-board-join-text">` +
    `<div class="pp-board-join-h">${esc(t.scanToPlay)}</div>` +
    updatedHtml(updatedAt, t) +
    `</div>` +
    `</div>`
  )
}

// Locked variant of the showcase join card: the padlock glyph instead of a QR
// scanning the entry page would dead-end on the locked form.
function joinPanelLocked(updatedAt: number, t: Board): string {
  return (
    `<div class="pp-board-join">` +
    `<div class="pp-board-join-lock">${lockGlyph()}</div>` +
    `<div class="pp-board-join-text">` +
    `<div class="pp-board-join-h">${esc(t.lockedAsideLine1)} ${esc(t.lockedAsideLine2)}</div>` +
    updatedHtml(updatedAt, t) +
    `</div>` +
    `</div>`
  )
}

function renderEmpty(t: Board): string {
  return (
    '<div class="pp-board-empty">' +
    `<div style="position:relative;width:96px;height:60px;margin-bottom:22px">` +
    `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:90px;height:26px;border-radius:50%;background:rgba(0,0,0,.35);box-shadow:inset 0 6px 10px rgba(0,0,0,.4)"></div>` +
    `<div style="position:absolute;bottom:14px;left:38px;width:3px;height:46px;background:#FFFDF8;border-radius:2px"></div>` +
    `<div style="position:absolute;bottom:46px;left:41px;width:22px;height:15px;background:#E2533B;clip-path:polygon(0 0,100% 50%,0 100%);transform-origin:left center;animation:pp-wave 2.4s ease-in-out infinite"></div>` +
    `</div>` +
    `<h2 class="pp-h" style="margin:0 0 8px;font-weight:800;font-size:clamp(20px,2.6vw,26px);color:#FFFDF8">${esc(t.emptyTitle)}</h2>` +
    `<p style="margin:0;font-family:var(--font-body);font-size:15px;color:rgba(246,241,230,.75)">${esc(t.emptyBody)}</p>` +
    '</div>'
  )
}
