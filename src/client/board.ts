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

function relTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 5) return 'gerade eben'
  if (s < 60) return `vor ${s} Sek.`
  const m = Math.round(s / 60)
  if (m < 60) return `vor ${m} Min.`
  const h = Math.round(m / 60)
  return `vor ${h} Std.`
}

function tickUpdated(): void {
  for (const el of document.querySelectorAll<HTMLElement>('.pp-updated[data-ts]')) {
    const ts = Number(el.dataset.ts)
    if (Number.isFinite(ts)) el.textContent = `aktualisiert ${relTime(ts)}`
  }
}

function apply(msg: StandingsMessage): void {
  if (!msg || msg.type !== 'standings') return
  if (live) live.innerHTML = msg.html
  if (participantsEl) participantsEl.textContent = String(msg.participants)
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
