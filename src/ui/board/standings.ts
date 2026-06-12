import { qrSvg } from '../../lib/qr'
import type { RankedRow } from '../../lib/ranking'
import { medalColor } from '../tokens'

// Plain HTML-string renderer for the live board region (#pp-board-live). Used by
// the initial server render, the JSON state endpoint, AND the GameRoom DO
// broadcast, so all three are byte-identical. User text is HTML-escaped here
// (no JSX auto-escape in raw strings).

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
}

export interface RenderedStandings {
  html: string
  participants: number
}

/** Renders the full inner HTML of #pp-board-live for the given ranked rows. */
export function renderStandings(rows: RankedRow[], opts: StandingsRenderOpts): RenderedStandings {
  const aside = qrAside(opts.entryUrl, opts.updatedAt)
  if (rows.length === 0) {
    return { html: `<div class="pp-board-body">${renderEmpty()}${aside}</div>`, participants: 0 }
  }
  const podium = `<div class="pp-podium" id="pp-podium">${renderPodium(rows.slice(0, 3))}</div>`
  const body =
    `<div class="pp-board-body">` +
    `<div class="pp-board-list" id="pp-list">${renderList(rows.slice(3))}</div>` +
    aside +
    `</div>`
  return { html: podium + body, participants: rows.length }
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

function podiumCard(row: RankedRow, isFirst: boolean): string {
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
  return (
    `<div class="pp-podium-card${isFirst ? ' pp-podium-card--first' : ''}" data-entry-id="${row.entry.id}">` +
    flag +
    `<div class="pp-rank-chip" style="width:${chipSize}px;height:${chipSize}px;background:${color};font-size:${chipFont}px;margin-bottom:10px">${row.rank}</div>` +
    `<div class="pp-podium-name" style="${accent}">${esc(row.entry.name)}</div>` +
    team +
    `<div class="pp-podium-score" style="${accent}font-size:${scoreFont}px" data-role="score">${row.entry.strokes}</div>` +
    `<div class="pp-podium-unit">Schläge</div>` +
    `</div>`
  )
}

function renderPodium(top: RankedRow[]): string {
  const first = top[0]
  const second = top[1]
  const third = top[2]
  const cards: string[] = []
  if (second) cards.push(podiumCard(second, false))
  if (first) cards.push(podiumCard(first, true))
  if (third) cards.push(podiumCard(third, false))
  return cards.join('')
}

function moveHtml(row: RankedRow): string {
  if (row.movement.dir === 'up')
    return `<span class="pp-move pp-move--up">▲${row.movement.places}</span>`
  if (row.movement.dir === 'down')
    return `<span class="pp-move pp-move--down">▼${row.movement.places}</span>`
  return ''
}

function listRow(row: RankedRow): string {
  const team = row.entry.team ? `<span class="pp-row-team">${esc(row.entry.team)}</span>` : ''
  const tie = row.tied ? '<span class="pp-tie">geteilt</span>' : ''
  return (
    `<div class="pp-row" data-entry-id="${row.entry.id}">` +
    `<span class="pp-row-rank">${row.rank}</span>` +
    ballHtml(14) +
    `<span class="pp-row-name">${esc(row.entry.name)}</span>` +
    team +
    tie +
    moveHtml(row) +
    `<span class="pp-row-score" data-role="score">${row.entry.strokes}</span>` +
    `</div>`
  )
}

function renderList(rest: RankedRow[]): string {
  return rest.map(listRow).join('')
}

function qrAside(entryUrl: string, updatedAt: number): string {
  return (
    `<div class="pp-board-aside">` +
    `<div class="pp-qr" style="width:132px;height:132px;padding:11px;border-radius:14px">${qrSvg(entryUrl, { module: 4 })}</div>` +
    `<div class="pp-h" style="font-weight:700;font-size:14px;color:#FFFDF8;margin-top:12px">Scan &amp; mitspielen</div>` +
    `<div class="pp-mono pp-updated" data-ts="${updatedAt}" style="font-size:10px;color:rgba(246,241,230,.6);margin-top:4px">aktualisiert gerade eben</div>` +
    `</div>`
  )
}

function renderEmpty(): string {
  return (
    '<div class="pp-board-empty">' +
    `<div style="position:relative;width:96px;height:60px;margin-bottom:22px">` +
    `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:90px;height:26px;border-radius:50%;background:rgba(0,0,0,.35);box-shadow:inset 0 6px 10px rgba(0,0,0,.4)"></div>` +
    `<div style="position:absolute;bottom:14px;left:38px;width:3px;height:46px;background:#FFFDF8;border-radius:2px"></div>` +
    `<div style="position:absolute;bottom:46px;left:41px;width:22px;height:15px;background:#E2533B;clip-path:polygon(0 0,100% 50%,0 100%);transform-origin:left center;animation:pp-wave 2.4s ease-in-out infinite"></div>` +
    `</div>` +
    `<h2 class="pp-h" style="margin:0 0 8px;font-weight:800;font-size:clamp(20px,2.6vw,26px);color:#FFFDF8">Noch keine Ergebnisse</h2>` +
    `<p style="margin:0;font-family:var(--font-body);font-size:15px;color:rgba(246,241,230,.75)">Sei die/der Erste auf dem Platz!</p>` +
    '</div>'
  )
}
