import type { FC } from 'hono/jsx'
import type { Game } from '../../db/schema'
import { formatGermanLong } from '../../lib/dates'
import type { Placement } from '../../lib/ranking'
import { Layout } from '../layout'
import { Confetti, Field, FieldError, FlagMark } from '../primitives'

export interface EntryFormValues {
  name?: string
  team?: string
  strokes?: string
  holes?: string[]
}

export interface EntryFormProps {
  game: Game
  values?: EntryFormValues
  errors?: Record<string, string>
}

const FORM_ATTRS = (publicId: string) => ({
  'hx-post': `/g/${publicId}/entries`,
  'hx-target': '#pp-entry-screen',
  'hx-select': '#pp-entry-screen',
  'hx-swap': 'outerHTML',
})

function Header({ game }: { game: Game }) {
  const perHole = game.entryMode === 'per_hole'
  return (
    <div class="pp-entry-head">
      <div class="pp-date-pill">
        {perHole ? null : <FlagMark size={14} />}
        {perHole ? `${game.holes} Bahnen` : formatGermanLong(game.date)}
      </div>
      <h1
        class="pp-h"
        style="margin:12px 0 4px;font-weight:800;font-size:26px;line-height:1.05;color:var(--pp-turf-to)"
      >
        {game.name}
      </h1>
      <p style="margin:0;font-family:var(--font-body);font-size:13px;color:var(--pp-text-soft)">
        {perHole
          ? 'Schläge pro Bahn — wir zählen zusammen.'
          : 'Trag deinen Score ein — wenig Schläge gewinnen.'}
      </p>
    </div>
  )
}

function HoleGrid({
  game,
  values,
  error,
}: {
  game: Game
  values?: EntryFormValues
  error?: string
}) {
  const holes = Array.from({ length: game.holes }, (_, i) => i + 1)
  const initial = (i: number) => values?.holes?.[i] ?? ''
  const total = (values?.holes ?? [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0)
    .reduce((a, b) => a + b, 0)
  return (
    <div>
      <span class="pp-field-label">
        Schläge pro Bahn <span class="pp-req">*</span>
      </span>
      <div class="pp-holes-grid" id="pp-holes">
        {holes.map((h, i) => (
          <div class="pp-hole" key={h}>
            <span class="idx">{h}</span>
            <input
              name={`hole_${h}`}
              type="number"
              inputmode="numeric"
              min="1"
              data-hole
              value={initial(i)}
              placeholder="–"
            />
          </div>
        ))}
      </div>
      {error ? <FieldError message={error} /> : null}
      <div class="pp-hole-total" style="margin-top:14px">
        <span class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-cream)">
          Gesamt
        </span>
        <span class="pp-score" id="pp-hole-total" style="font-size:28px;color:var(--pp-sunny)">
          {total}
        </span>
      </div>
    </div>
  )
}

/** The swappable screen content in its form state. */
export const EntryFormScreen: FC<EntryFormProps> = ({ game, values, errors }) => {
  const perHole = game.entryMode === 'per_hole'
  return (
    <div id="pp-entry-screen" class="pp-screen">
      <Header game={game} />
      <form class="pp-entry-form" {...FORM_ATTRS(game.publicId)} data-entry-mode={game.entryMode}>
        <Field
          name="name"
          label="Name"
          required
          placeholder="Dein Name"
          value={values?.name}
          error={errors?.name}
          autofocus
        />
        {game.teamsEnabled ? (
          <Field
            name="team"
            label="Team / Abteilung"
            optional
            placeholder="z. B. Diakonie"
            value={values?.team}
            error={errors?.team}
          />
        ) : null}

        {perHole ? (
          <HoleGrid game={game} values={values} error={errors?.holeStrokes} />
        ) : (
          <Field
            name="strokes"
            label="Gesamtschläge"
            required
            type="number"
            inputMode="numeric"
            placeholder="z. B. 42"
            value={values?.strokes}
            error={errors?.strokes}
            inputClass="pp-input--score"
          />
        )}

        <button type="submit" class="pp-btn pp-btn--primary pp-btn--lg pp-btn--block">
          <FlagMark size={18} pole="#FFFDF8" flag="#F2C14E" animate={false} />
          Eintragen
        </button>
        <a
          href={`/g/${game.publicId}/board`}
          style="display:block;text-align:center;font-family:var(--font-head);font-weight:600;font-size:14px;color:var(--pp-green-text);text-decoration:none;padding-top:2px"
        >
          Zur Bestenliste →
        </a>
      </form>
    </div>
  )
}

/** Swappable screen content in its success state. */
export const EntrySuccessScreen: FC<{
  game: Game
  name: string
  strokes: number
  placement: Placement
}> = ({ game, name, strokes, placement }) => (
  <div id="pp-entry-screen" class="pp-screen pp-screen--success">
    <Confetti />
    <div style="padding:30px 24px 34px;text-align:center;color:var(--pp-cream);position:relative;z-index:3">
      <div style="position:relative;width:78px;height:78px;margin:8px auto 18px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#F2C14E;animation:pp-pulse 1.8s ease-out infinite"></div>
        <div style="position:absolute;inset:14px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff,#efe8d4 60%,#d6cfba);box-shadow:inset -3px -3px 5px rgba(22,38,31,.18)"></div>
      </div>
      <h1 class="pp-h" style="margin:0 0 6px;font-weight:800;font-size:27px">
        Eingetragen! 🏌️
      </h1>
      <p style="margin:0 0 22px;font-family:var(--font-body);font-size:14px;color:rgba(246,241,230,.78)">
        Stark gespielt, <strong style="color:var(--pp-cream)">{name}</strong>. Dein Score steht.
      </p>
      <div style="background:rgba(255,253,248,.1);border:1px solid rgba(246,241,230,.18);border-radius:18px;padding:18px">
        <div
          class="pp-mono"
          style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:rgba(246,241,230,.6);margin-bottom:8px"
        >
          Deine Platzierung
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px">
          <span class="pp-score" style="font-size:52px;line-height:1;color:var(--pp-sunny)">
            {placement.rank}.
          </span>
          <div style="text-align:left">
            <div class="pp-h" style="font-weight:700;font-size:16px;color:var(--pp-cream)">
              von {placement.total}
            </div>
            {placement.placesAhead > 0 ? (
              <div style="display:inline-flex;align-items:center;gap:5px;font-family:var(--font-body);font-weight:600;font-size:12px;color:#8fe6b0;margin-top:2px">
                <span style="font-size:14px">▲</span> {placement.placesAhead} Plätze
              </div>
            ) : null}
          </div>
          <span class="pp-score" style="font-size:34px;color:var(--pp-cream)">
            {strokes}
          </span>
        </div>
      </div>
      <a
        href={`/g/${game.publicId}/board`}
        class="pp-btn pp-btn--gold pp-btn--block"
        style="margin-top:20px;font-size:17px;padding:15px"
      >
        Zur Bestenliste
      </a>
    </div>
  </div>
)

/** Swappable screen content when the round is not open. */
export const EntryLockedScreen: FC<{ game: Game }> = ({ game }) => (
  <div id="pp-entry-screen" class="pp-screen">
    <div style="padding:44px 28px 38px;text-align:center">
      <div style="width:72px;height:72px;margin:0 auto 20px;border-radius:50%;background:#ECE9DF;border:1px solid #ddd6c4;display:flex;align-items:center;justify-content:center">
        <div style="width:26px;height:22px;border:3.5px solid #6B7B6E;border-radius:6px;border-top-color:transparent;position:relative">
          <span style="position:absolute;left:50%;top:-16px;transform:translateX(-50%);width:18px;height:18px;border:3.5px solid #6B7B6E;border-bottom:none;border-radius:10px 10px 0 0"></span>
        </div>
      </div>
      <h1
        class="pp-h"
        style="margin:0 0 8px;font-weight:800;font-size:23px;color:var(--pp-turf-to)"
      >
        Diese Runde ist geschlossen
      </h1>
      <p style="margin:0 0 24px;font-family:var(--font-body);font-size:14px;color:var(--pp-text-soft);line-height:1.5">
        Es werden keine neuen Scores mehr angenommen. Schau dir an, wer gewonnen hat!
      </p>
      <a
        href={`/g/${game.publicId}/board`}
        class="pp-btn pp-btn--dark pp-btn--block"
        style="font-size:17px;padding:15px"
      >
        Zur Bestenliste
      </a>
    </div>
  </div>
)

// ---- Full-page wrappers ----

export const EntryPage: FC<EntryFormProps> = (props) => (
  <Layout
    title={`${props.game.name} · Eintragen`}
    bodyClass="pp-body--entry"
    htmx
    scripts={['/entry.js']}
  >
    <EntryFormScreen {...props} />
  </Layout>
)

export const EntrySuccessPage: FC<{
  game: Game
  name: string
  strokes: number
  placement: Placement
}> = (props) => (
  <Layout
    title={`${props.game.name} · Eingetragen`}
    bodyClass="pp-body--entry"
    htmx
    scripts={['/entry.js']}
  >
    <EntrySuccessScreen {...props} />
  </Layout>
)

export const EntryLockedPage: FC<{ game: Game }> = ({ game }) => (
  <Layout title={`${game.name} · Geschlossen`} bodyClass="pp-body--entry">
    <EntryLockedScreen game={game} />
  </Layout>
)
