import { DurableObject } from 'cloudflare:workers'
import type { Env } from '../bindings'
import { getDb, getGameByPublicId, listEntries } from '../db/queries'
import { computeStandings, diffStandings, type RankableEntry, type Standing } from '../lib/ranking'
import { renderStandings } from '../ui/board/standings'
import { type StandingsMessage, toRankable } from './protocol'

/**
 * One GameRoom per game (addressed via idFromName(publicId)). Owns the live
 * WebSocket connections for that game's board and broadcasts standings.
 *
 * Uses the WebSocket Hibernation API so idle boards don't incur duration billing.
 * It persists the previous standings snapshot (to diff ▲/▼ movement) and the
 * latest rendered message (to replay to boards that connect/reconnect).
 *
 * The DO reads the current entries from D1 itself (the source of truth) inside
 * its serialized execution, so concurrent mutations can't produce a
 * last-writer-wins stale board.
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

  private async loadEntries(publicId: string): Promise<RankableEntry[]> {
    const db = getDb(this.env)
    const game = await getGameByPublicId(db, publicId)
    if (!game) return []
    return toRankable(await listEntries(db, game.id))
  }

  /**
   * Renders + persists the latest message. `updatePrev` controls whether the
   * movement-diff baseline is advanced — true on a real mutation, false on a
   * board-load sync (so a board reload doesn't reset the ▲/▼ baseline).
   */
  private async render(
    entries: RankableEntry[],
    entryUrl: string,
    updatePrev: boolean,
  ): Promise<StandingsMessage> {
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
    if (updatePrev) await this.ctx.storage.put('prev', next)
    await this.ctx.storage.put('latest', message)
    return message
  }

  /**
   * Called by the Worker (RPC) after any entry mutation. Reads current entries
   * from D1, diffs movement vs the stored snapshot, renders, persists, broadcasts.
   */
  async update(publicId: string, entryUrl: string): Promise<StandingsMessage> {
    const message = await this.render(await this.loadEntries(publicId), entryUrl, true)
    this.broadcast(message)
    return message
  }

  /**
   * Refreshes the replay cache from D1 without broadcasting and without touching
   * the movement baseline. Called when a board page loads so replay-on-connect
   * reflects the source of truth even if D1 changed out-of-band (e.g. seeding).
   */
  async sync(publicId: string, entryUrl: string): Promise<StandingsMessage> {
    return this.render(await this.loadEntries(publicId), entryUrl, false)
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
