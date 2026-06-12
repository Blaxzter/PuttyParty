import { DurableObject } from 'cloudflare:workers'
import type { Env } from '../bindings'

/**
 * One GameRoom per game (addressed via idFromName(publicId)). Owns the live
 * WebSocket connections for that game's board and broadcasts standings.
 *
 * Fleshed out in a later step (WebSocket Hibernation + snapshot diff). This stub
 * exists so the binding/type resolves and the Worker can boot.
 */
export class GameRoom extends DurableObject<Env> {}
