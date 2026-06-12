import type { Env } from './bindings'
import type { Entry, Game } from './db/schema'
import { toRankable } from './do/protocol'

/** The GameRoom DO stub for a game (one per publicId). */
export function gameRoom(env: Env, publicId: string) {
  return env.GAME_ROOM.get(env.GAME_ROOM.idFromName(publicId))
}

/**
 * Pushes the current standings to every connected board for this game.
 * Best-effort: a realtime failure must never fail the underlying mutation, so
 * callers can ignore rejections (boards still recover via the polling fallback).
 */
export function entryUrlFor(env: Env, publicId: string): string {
  return `${env.APP_BASE_URL.replace(/\/$/, '')}/g/${publicId}`
}

export async function notifyBoard(env: Env, game: Game, entries: Entry[]): Promise<void> {
  const stub = gameRoom(env, game.publicId)
  await stub.update(toRankable(entries), entryUrlFor(env, game.publicId))
}

/**
 * Syncs the game's DO snapshot to D1 without broadcasting — called when a board
 * page loads so a fresh connection replays the current source of truth.
 */
export async function syncBoard(env: Env, game: Game, entries: Entry[]): Promise<void> {
  const stub = gameRoom(env, game.publicId)
  await stub.sync(toRankable(entries), entryUrlFor(env, game.publicId))
}
