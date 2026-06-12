import { DurableObject } from 'cloudflare:workers'
import type { Env } from '../bindings'
import { computeStandings, diffStandings, type RankableEntry, type Standing } from '../lib/ranking'
import { renderStandings } from '../ui/board/standings'
import type { StandingsMessage } from './protocol'

/**
 * One GameRoom per game (addressed via idFromName(publicId)). Owns the live
 * WebSocket connections for that game's board and broadcasts standings.
 *
 * Uses the WebSocket Hibernation API so idle boards don't incur duration billing.
 * It persists the previous standings snapshot (to diff ▲/▼ movement) and the
 * latest rendered message (to replay to boards that connect/reconnect).
 */
export class GameRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    // Heartbeat handled by the runtime without waking the object.
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  override async fetch(_request: Request): Promise<Response> {
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    this.ctx.acceptWebSocket(server)
    // Send current standings immediately so a newly-connected board is up to date.
    const latest = await this.ctx.storage.get<StandingsMessage>('latest')
    if (latest) {
      try {
        server.send(JSON.stringify(latest))
      } catch {
        /* connection raced closed */
      }
    }
    return new Response(null, { status: 101, webSocket: client })
  }

  /**
   * Called by the Worker (RPC) after any entry mutation, with the full current
   * entry list and the absolute entry URL (for the board QR). Computes standings,
   * diffs movement vs the stored snapshot, renders, persists, and broadcasts.
   */
  async update(entries: RankableEntry[], entryUrl: string): Promise<StandingsMessage> {
    const prev = (await this.ctx.storage.get<Standing[]>('prev')) ?? null
    const next = computeStandings(entries)
    const rows = diffStandings(prev, next)
    const updatedAt = Date.now()
    const rendered = renderStandings(rows, { entryUrl, updatedAt })
    const message: StandingsMessage = {
      type: 'standings',
      html: rendered.html,
      participants: rendered.participants,
      updatedAt,
    }
    await this.ctx.storage.put('prev', next)
    await this.ctx.storage.put('latest', message)
    this.broadcast(message)
    return message
  }

  broadcast(message: StandingsMessage): void {
    const data = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data)
      } catch {
        /* drop dead sockets silently */
      }
    }
  }

  override async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try {
      ws.close(code)
    } catch {
      /* already closing */
    }
  }

  override async webSocketError(): Promise<void> {
    /* nothing to do; runtime removes the socket */
  }
}
