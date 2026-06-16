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

/** Per-hole stroke count (1–99). */
function holeStrokeField(v: V) {
  return z.preprocess(
    (val) => {
      const n = Number(String(val ?? '').trim())
      return Number.isFinite(n) ? n : Number.NaN
    },
    z
      .number({ error: v.perHoleFrom1 })
      .int(v.wholeNumbers)
      .min(1, v.perHoleFrom1)
      .max(99, v.maxPerHole),
  )
}

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
    /** Per-hole submission: validates exactly `holes` values. */
    perHoleEntrySchema: (holes: number) =>
      z.object({
        name: nameField(v),
        team: optionalText(60),
        holeStrokes: z.array(holeStrokeField(v)).length(holes, v.allHoles),
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
