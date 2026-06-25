import { z } from 'zod'
import { type Dictionary, getDictionary } from '../i18n'
import { anyToIso } from './dates'

// Form bodies arrive as Record<string, string | File>. These schemas validate +
// coerce them. Validation messages come from the dictionary so they render in the
// game's / visitor's language; build them with make*(t) at the call site. The
// de-bound exports at the bottom keep admin internals + the test suite simple.

type V = Dictionary['validation']

/** A whole stroke count that rejects empty/non-numeric input with a single message. */
function strokeField(v: V) {
  return z.preprocess(
    (val) => {
      const n = Number(String(val ?? '').trim())
      return Number.isFinite(n) ? n : Number.NaN
    },
    z
      .number({ error: v.numberFrom1 })
      .int(v.numberFrom1)
      .min(1, v.numberFrom1)
      .max(999, v.maxStrokes),
  )
}

/**
 * Per-hole stroke count (1..cap). `cap` defaults to 99 (a sanity bound); a game
 * with a configured stroke limit passes its recordable maximum
 * (limit + pickup penalty) so the cap message names the right number.
 */
function holeStrokeField(v: V, cap = 99) {
  return z.preprocess(
    (val) => {
      const n = Number(String(val ?? '').trim())
      return Number.isFinite(n) ? n : Number.NaN
    },
    z
      .number({ error: v.perHoleFrom1 })
      .int(v.wholeNumbers)
      .min(1, v.perHoleFrom1)
      .max(cap, cap === 99 ? v.maxPerHole : v.maxPerHoleN(cap)),
  )
}

/**
 * Optional per-hole stroke limit. Empty -> null (no limit); otherwise 1..90 so
 * that limit + penalty stays within the 99 per-hole sanity bound.
 */
const strokeLimitField = (v: V) =>
  z.preprocess((val) => {
    const s = String(val ?? '').trim()
    if (s === '') return null
    const n = Number(s)
    return Number.isFinite(n) ? n : Number.NaN
  }, z
    .number()
    .int(v.strokeLimitRange)
    .min(1, v.strokeLimitRange)
    .max(90, v.strokeLimitRange)
    .nullable())

/** Pickup penalty (0..9). Empty -> 1 (the classic "+1" on pickup). */
const pickupPenaltyField = (v: V) =>
  z.preprocess(
    (val) => {
      const s = String(val ?? '').trim()
      if (s === '') return 1
      const n = Number(s)
      return Number.isFinite(n) ? n : Number.NaN
    },
    z.number().int(v.penaltyRange).min(0, v.penaltyRange).max(9, v.penaltyRange),
  )

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))

const nameField = (v: V) => z.string().trim().min(1, v.nameRequired).max(60)

/** Admin: native date input (ISO) or TT.MM.JJJJ -> ISO date. */
const dateField = (v: V) =>
  z
    .string()
    .trim()
    .min(1, v.dateRequired)
    .transform((d, ctx) => {
      const iso = anyToIso(d)
      if (!iso) {
        ctx.addIssue({ code: 'custom', message: v.invalidDate })
        return z.NEVER
      }
      return iso
    })

/** Checkbox/toggle -> boolean (present & truthy -> true). */
const toggleField = z.preprocess(
  (val) => val === true || val === 'true' || val === 'on' || val === '1',
  z.boolean(),
)

// Keep in sync with i18n LOCALES.
const localeField = z.enum(['de', 'en'])

// ---- Public entry submission ----

export function makeEntrySchemas(t: Dictionary) {
  const v = t.validation
  return {
    totalEntrySchema: z.object({
      name: nameField(v),
      team: optionalText(60),
      strokes: strokeField(v),
    }),
    /**
     * Per-hole submission: validates exactly `holes` values. `maxPerHole`, when
     * the game has a stroke limit, caps each hole at limit + pickup penalty.
     */
    perHoleEntrySchema: (holes: number, maxPerHole?: number) =>
      z.object({
        name: nameField(v),
        team: optionalText(60),
        holeStrokes: z.array(holeStrokeField(v, maxPerHole)).length(holes, v.allHoles),
      }),
    // Admin: organiser edits the total directly, even for per-hole games.
    adminEntrySchema: z.object({
      name: nameField(v),
      team: optionalText(60),
      strokes: strokeField(v),
    }),
  }
}

// ---- Admin: games ----

export function makeGameSchema(t: Dictionary) {
  const v = t.validation
  return z.object({
    name: z.string().trim().min(1, v.gameNameRequired).max(80),
    date: dateField(v),
    location: optionalText(120),
    holes: z.preprocess(
      (val) => {
        const n = Number(String(val ?? '').trim())
        return Number.isFinite(n) ? n : 9
      },
      z.number().int().min(1, v.minHole).max(60, v.maxHoles),
    ),
    maxStrokesPerHole: strokeLimitField(v),
    pickupPenalty: pickupPenaltyField(v),
    entryMode: z.enum(['total', 'per_hole']).default('total'),
    teamsEnabled: toggleField,
    status: z.enum(['open', 'locked']).default('open'),
    locale: localeField.optional(),
  })
}

export function makeUpdateGameSchema(t: Dictionary) {
  const v = t.validation
  return z.object({
    name: z.string().trim().min(1).max(80).optional(),
    date: dateField(v).optional(),
    location: optionalText(120),
    holes: z.coerce.number().int().min(1).max(60).optional(),
    maxStrokesPerHole: strokeLimitField(v).optional(),
    pickupPenalty: pickupPenaltyField(v).optional(),
    entryMode: z.enum(['total', 'per_hole']).optional(),
    teamsEnabled: toggleField.optional(),
    status: z.enum(['open', 'locked', 'archived']).optional(),
    locale: localeField.optional(),
  })
}

/** Flattens a ZodError into { field: firstMessage } for inline rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error)
  const out: Record<string, string> = {}
  for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(msgs) && msgs.length > 0 && msgs[0]) out[key] = msgs[0]
  }
  return out
}

// ---- German-bound defaults (admin internals + tests) ----
const deDict = getDictionary('de')
const deEntry = makeEntrySchemas(deDict)
export const totalEntrySchema = deEntry.totalEntrySchema
export const perHoleEntrySchema = deEntry.perHoleEntrySchema
export const adminEntrySchema = deEntry.adminEntrySchema
export const createGameSchema = makeGameSchema(deDict)
export const updateGameSchema = makeUpdateGameSchema(deDict)

export type TotalEntryInput = z.infer<typeof totalEntrySchema>
export type CreateGameInputParsed = z.infer<typeof createGameSchema>
export type UpdateGameInputParsed = z.infer<typeof updateGameSchema>
export type AdminEntryInput = z.infer<typeof adminEntrySchema>
