// Live board client: subscribes over WebSocket (partysocket, auto-reconnect) and
// falls back to polling the JSON state endpoint whenever the socket is down.
import { WebSocket as ReconnectingWebSocket } from 'partysocket'

interface StandingsMessage {
  type: 'standings'
  html: string
  participants: number
  updatedAt: number
}

const board = document.querySelector<HTMLElement>('.pp-board')
const publicId = board?.dataset.publicId
const live = document.getElementById('pp-board-live')
const participantsEl = document.getElementById('pp-participants')
const confetti = document.querySelector<HTMLElement>('.pp-board-confetti')

// Relative "last updated" copy in the game's language (data-locale on .pp-board).
// Must match the server's initial render in src/ui/board/standings.ts.
const TIME = {
  de: {
    updated: 'aktualisiert ',
    justNow: 'gerade eben',
    sec: (s: number) => `vor ${s} Sek.`,
    min: (m: number) => `vor ${m} Min.`,
    hr: (h: number) => `vor ${h} Std.`,
  },
  en: {
    updated: 'updated ',
    justNow: 'just now',
    sec: (s: number) => `${s}s ago`,
    min: (m: number) => `${m}m ago`,
    hr: (h: number) => `${h}h ago`,
  },
}[board?.dataset.locale === 'en' ? 'en' : 'de']

function relTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 5) return TIME.justNow
  if (s < 60) return TIME.sec(s)
  const m = Math.round(s / 60)
  if (m < 60) return TIME.min(m)
  const h = Math.round(m / 60)
  return TIME.hr(h)
}

function tickUpdated(): void {
  for (const el of document.querySelectorAll<HTMLElement>('.pp-updated[data-ts]')) {
    const ts = Number(el.dataset.ts)
    if (Number.isFinite(ts)) el.textContent = `${TIME.updated}${relTime(ts)}`
  }
}

// Per-hole games: rows/podium cards expand to a scorecard. Which entries are
// open is tracked by id so the state survives the innerHTML swap on every live
// update (a new score otherwise collapses what the viewer was looking at).
const EXP_SELECTOR = '.pp-row--exp, .pp-podium-card--exp'
const expanded = new Set<number>()

function entryIdOf(el: HTMLElement): number | null {
  const id = Number(el.dataset.entryId)
  return Number.isFinite(id) ? id : null
}

function setOpen(el: HTMLElement, open: boolean): void {
  el.classList.toggle('pp-open', open)
  el.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function toggleExpand(el: HTMLElement): void {
  const id = entryIdOf(el)
  if (id == null) return
  const open = !expanded.has(id)
  if (open) expanded.add(id)
  else expanded.delete(id)
  setOpen(el, open)
}

function restoreExpanded(): void {
  if (!live) return
  for (const el of live.querySelectorAll<HTMLElement>(EXP_SELECTOR)) {
    const id = entryIdOf(el)
    if (id != null && expanded.has(id)) setOpen(el, true)
  }
}

if (live) {
  live.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(EXP_SELECTOR)
    if (el) toggleExpand(el)
  })
  live.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(EXP_SELECTOR)
    if (el) {
      e.preventDefault()
      toggleExpand(el)
    }
  })
}

let lastApplied = 0

function apply(msg: StandingsMessage): void {
  if (!msg) return
  if (msg.type !== 'standings') return
  // Ignore stale frames (e.g. a WS replay older than the last poll result) so the
  // three update paths (replay / broadcast / poll) commute regardless of order.
  if (typeof msg.updatedAt === 'number' && msg.updatedAt <= lastApplied) return
  lastApplied = msg.updatedAt
  if (live) live.innerHTML = msg.html
  if (participantsEl) participantsEl.textContent = String(msg.participants)
  // Confetti lives in the static shell (outside #pp-board-live), so toggle it
  // here: no participants → no podium → no confetti.
  if (confetti) confetti.classList.toggle('pp-board-confetti--hidden', msg.participants === 0)
  // 1–3 players use the centred showcase layout; keep the shell's marker class in
  // sync so the confetti re-anchors above the podium (mirrors BoardPage's `few`).
  if (board) board.classList.toggle('pp-board--few', msg.participants >= 1 && msg.participants <= 3)
  restoreExpanded()
  tickUpdated()
}

setInterval(tickUpdated, 5000)
tickUpdated()

if (publicId) {
  let pollTimer: ReturnType<typeof setInterval> | undefined

  async function pollOnce(): Promise<void> {
    try {
      const res = await fetch(`/g/${publicId}/board/state`, {
        headers: { accept: 'application/json' },
      })
      if (res.ok) apply(await res.json())
    } catch {
      /* keep trying */
    }
  }
  function startPolling(): void {
    if (pollTimer == null) {
      void pollOnce()
      pollTimer = setInterval(pollOnce, 5000)
    }
  }
  function stopPolling(): void {
    if (pollTimer != null) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  }

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new ReconnectingWebSocket(`${proto}//${location.host}/g/${publicId}/ws`)

  ws.addEventListener('message', (e: MessageEvent) => {
    try {
      apply(JSON.parse(String(e.data)))
    } catch {
      /* ignore malformed frame */
    }
  })
  ws.addEventListener('open', stopPolling)
  ws.addEventListener('close', startPolling)
  ws.addEventListener('error', startPolling)

  // Keep the hibernating DO connection warm via its ping/pong auto-response.
  setInterval(() => {
    if (ws.readyState === 1) ws.send('ping')
  }, 25000)
}
