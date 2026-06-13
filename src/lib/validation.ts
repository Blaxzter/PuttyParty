import { z } from "zod";
import { anyToIso } from "./dates";

// Form bodies arrive as Record<string, string | File>. These schemas validate +
// coerce them. Public-facing messages are German (shown inline in the UI).

/** A whole stroke count that rejects empty/non-numeric input with a single message. */
function strokeField(msg = "Bitte eine Zahl ab 1 eingeben.") {
    return z.preprocess(
        (v) => {
            const n = Number(String(v ?? "").trim());
            return Number.isFinite(n) ? n : Number.NaN;
        },
        z
            .number({ error: msg })
            .int(msg)
            .min(1, msg)
            .max(999, "Maximal 999 Schläge."),
    );
}

/** Per-hole stroke count (1–99). */
function holeStrokeField() {
    return z.preprocess(
        (v) => {
            const n = Number(String(v ?? "").trim());
            return Number.isFinite(n) ? n : Number.NaN;
        },
        z
            .number({ error: "Bitte für jede Bahn eine Zahl ab 1 eingeben." })
            .int("Bitte ganze Zahlen eingeben.")
            .min(1, "Bitte für jede Bahn eine Zahl ab 1 eingeben.")
            .max(99, "Maximal 99 Schläge pro Bahn."),
    );
}

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => (v && v.length > 0 ? v : null));

const nameField = z
    .string()
    .trim()
    .min(1, "Bitte deinen Namen eingeben.")
    .max(60);

/** Admin: native date input (ISO) or TT.MM.JJJJ -> ISO date. */
const germanDateToIso = z
    .string()
    .trim()
    .min(1, "Datum ist erforderlich.")
    .transform((d, ctx) => {
        const iso = anyToIso(d);
        if (!iso) {
            ctx.addIssue({ code: "custom", message: "Ungültiges Datum." });
            return z.NEVER;
        }
        return iso;
    });

/** Checkbox/toggle -> boolean (present & truthy -> true). */
const toggleField = z.preprocess(
    (v) => v === true || v === "true" || v === "on" || v === "1",
    z.boolean(),
);

// ---- Public entry submission ----

export const totalEntrySchema = z.object({
    name: nameField,
    team: optionalText(60),
    strokes: strokeField(),
});

/** Per-hole submission: validates exactly `holes` values (built into a `holeStrokes` array by the route). */
export function perHoleEntrySchema(holes: number) {
    return z.object({
        name: nameField,
        team: optionalText(60),
        holeStrokes: z
            .array(holeStrokeField())
            .length(holes, "Bitte alle Bahnen ausfüllen."),
    });
}

// ---- Admin: games ----

export const createGameSchema = z.object({
    name: z.string().trim().min(1, "Name ist erforderlich.").max(80),
    date: germanDateToIso,
    location: optionalText(120),
    holes: z.preprocess(
        (v) => {
            const n = Number(String(v ?? "").trim());
            return Number.isFinite(n) ? n : 9;
        },
        z
            .number()
            .int()
            .min(1, "Mindestens 1 Bahn.")
            .max(60, "Maximal 60 Bahnen."),
    ),
    entryMode: z.enum(["total", "per_hole"]).default("total"),
    teamsEnabled: toggleField,
    status: z.enum(["open", "locked"]).default("open"),
});

export const updateGameSchema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    date: germanDateToIso.optional(),
    location: optionalText(120),
    holes: z.coerce.number().int().min(1).max(60).optional(),
    entryMode: z.enum(["total", "per_hole"]).optional(),
    teamsEnabled: toggleField.optional(),
    status: z.enum(["open", "locked", "archived"]).optional(),
});

// ---- Admin: entries (organiser edits the total directly, even for per-hole games) ----

export const adminEntrySchema = z.object({
    name: nameField,
    team: optionalText(60),
    strokes: strokeField(),
});

/** Flattens a ZodError into { field: firstMessage } for inline rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
    const flat = z.flattenError(error);
    const out: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        if (Array.isArray(msgs) && msgs.length > 0 && msgs[0])
            out[key] = msgs[0];
    }
    return out;
}

export type TotalEntryInput = z.infer<typeof totalEntrySchema>;
export type CreateGameInputParsed = z.infer<typeof createGameSchema>;
export type UpdateGameInputParsed = z.infer<typeof updateGameSchema>;
export type AdminEntryInput = z.infer<typeof adminEntrySchema>;
