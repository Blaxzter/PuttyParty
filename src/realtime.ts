import type { Env } from './bindings'
import type { Game } from './db/schema'

/** The GameRoom DO stub for a game (one per publicId). */
export function gameRoom(env: Env, publicId: string) {
  return env.GAME_ROOM.get(env.GAME_ROOM.idFromName(publicId))
}

export function entryUrlFor(env: Env, publicId: string): string {
  return `${env.APP_BASE_URL.replace(/\/$/, '')}/g/${publicId}`
}

/**
 * Tells the game's DO to recompute from D1 and broadcast to every connected board.
 * Best-effort: a realtime failure must never fail the underlying mutation, so
 * callers can ignore rejections (boards still recover via the polling fallback).
 */
export async function notifyBoard(env: Env, game: Game): Promise<void> {
  await gameRoom(env, game.publicId).update(game.publicId, entryUrlFor(env, game.publicId))
}

/**
 * Refreshes the game's DO replay cache from D1 without broadcasting — called when
 * a board page loads so a fresh connection replays the current source of truth.
 */
export async function syncBoard(env: Env, game: Game): Promise<void> {
  await gameRoom(env, game.publicId).sync(game.publicId, entryUrlFor(env, game.publicId))
}
