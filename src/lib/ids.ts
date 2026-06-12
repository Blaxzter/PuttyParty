import { customAlphabet } from 'nanoid'

// Lowercase alphanumerics — unambiguous in URLs and QR codes.
const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)

/** Opaque, unguessable public id for a game (e.g. "k3f9a1b7c2d4"). */
export function newPublicId(): string {
  return nano()
}
