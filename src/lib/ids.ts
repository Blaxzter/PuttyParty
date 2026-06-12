import { customAlphabet } from 'nanoid'

// Lowercase alphanumerics — unambiguous in URLs and QR codes.
const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)

// Manage tokens grant write access, so use a larger mixed-case alphabet + length.
const nanoManage = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  24,
)

/** Opaque, unguessable public id for a game (used in /g/ URLs). */
export function newPublicId(): string {
  return nano()
}

/** Secret, unguessable manage token (capability URL /m/<token>) for a game owner. */
export function newManageId(): string {
  return nanoManage()
}
