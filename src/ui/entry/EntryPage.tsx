import type { FC } from 'hono/jsx'
import type { Game } from '../../db/schema'
import { useI18n, useT } from '../../i18n'
import { formatLongDate } from '../../lib/dates'
import type { Placement } from '../../lib/ranking'
import { Layout } from '../layout'
import { Confetti, Field, FieldError, FlagMark, TrophyMark } from '../primitives'

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
  const { t, locale } = useI18n()
  const perHole = game.entryMode === 'per_hole'
  return (
    <div class="pp-entry-head">
      <div class="pp-date-pill">
        {perHole ? null : <FlagMark size={14} />}
        {perHole ? t.entry.holesCount(game.holes) : formatLongDate(game.date, locale)}
      </div>
      <h1
        class="pp-h"
        style="margin:12px 0 4px;font-weight:800;font-size:26px;line-height:1.05;color:var(--pp-turf-to)"
      >
        {game.name}
      </h1>
      <p style="margin:0;font-family:var(--font-body);font-size:13px;color:var(--pp-text-soft)">
        {perHole ? t.entry.subPerHole : t.entry.subTotal}
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
  const t = useT()
  const holes = Array.from({ length: game.holes }, (_, i) => i + 1)
  const initial = (i: number) => values?.holes?.[i] ?? ''
  // Players enter strokes *played* (1..limit). Reaching the limit means the ball
  // was picked up, so the pickup penalty is added — shown per cell as a "+n"
  // badge rather than folded into a single number. recordedOf mirrors the server.
  const limit = game.maxStrokesPerHole
  const penalty = game.pickupPenalty
  const reachedLimit = (n: number) => limit != null && Number.isFinite(n) && n >= limit
  const recordedOf = (n: number) => (reachedLimit(n) ? n + penalty : n)
  const total = (values?.holes ?? [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0)
    .reduce((sum, n) => sum + recordedOf(n), 0)
  return (
    <div>
      <span class="pp-field-label">
        {t.entry.holesLabel} <span class="pp-req">*</span>
      </span>
      {limit != null ? (
        <span style="display:block;margin:-2px 0 8px;font-family:var(--font-body);font-size:12px;color:var(--pp-text-soft)">
          {t.entry.maxPerHoleHint(limit, penalty)}
        </span>
      ) : null}
      <div
        class="pp-holes-grid"
        id="pp-holes"
        data-limit={limit ?? undefined}
        data-penalty={penalty}
      >
        {holes.map((h, i) => (
          <div class="pp-hole" key={h}>
            <span class="idx">{h}</span>
            <input
              name={`hole_${h}`}
              type="number"
              inputmode="numeric"
              min="1"
              max={limit ?? undefined}
              data-hole
              value={initial(i)}
              placeholder="–"
            />
            {limit != null ? (
              <span
                class="pp-hole__badge"
                data-hole-badge
                hidden={!reachedLimit(Number(initial(i)))}
              >
                +{penalty}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {error ? <FieldError message={error} /> : null}
      <div class="pp-hole-total" style="margin-top:14px">
        <span class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-cream)">
          {t.entry.total}
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
  const t = useT()
  const perHole = game.entryMode === 'per_hole'
  return (
    <div id="pp-entry-screen" class="pp-screen">
      <Header game={game} />
      <form class="pp-entry-form" {...FORM_ATTRS(game.publicId)} data-entry-mode={game.entryMode}>
        <Field
          name="name"
          label={t.entry.nameLabel}
          required
          placeholder={t.entry.namePlaceholder}
          value={values?.name}
          error={errors?.name}
          autofocus
        />
        {game.teamsEnabled ? (
          <Field
            name="team"
            label={t.entry.teamLabel}
            optional
            placeholder={t.entry.teamPlaceholder}
            value={values?.team}
            error={errors?.team}
          />
        ) : null}

        {perHole ? (
          <HoleGrid game={game} values={values} error={errors?.holeStrokes} />
        ) : (
          <Field
            name="strokes"
            label={t.entry.strokesLabel}
            required
            type="number"
            inputMode="numeric"
            placeholder={t.entry.strokesPlaceholder}
            value={values?.strokes}
            error={errors?.strokes}
            inputClass="pp-input--score"
          />
        )}

        <button type="submit" class="pp-btn pp-btn--primary pp-btn--lg pp-btn--block">
          <FlagMark size={18} pole="#FFFDF8" flag="#F2C14E" animate={false} />
          {t.entry.submit}
        </button>
        <a
          href={`/g/${game.publicId}/board`}
          style="display:block;text-align:center;font-family:var(--font-head);font-weight:600;font-size:14px;color:var(--pp-green-text);text-decoration:none;padding-top:2px"
        >
          {t.entry.toBoardArrow}
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
}> = ({ game, name, strokes, placement }) => {
  const t = useT()
  return (
    <div id="pp-entry-screen" class="pp-screen pp-screen--success">
      <Confetti />
      <div style="padding:30px 24px 34px;text-align:center;color:var(--pp-cream);position:relative;z-index:3">
        <div style="position:relative;width:78px;height:78px;margin:8px auto 18px">
          <div style="position:absolute;inset:0;border-radius:50%;background:#F2C14E;animation:pp-pulse 1.8s ease-out infinite"></div>
          <div style="position:absolute;inset:14px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff,#efe8d4 60%,#d6cfba);box-shadow:inset -3px -3px 5px rgba(22,38,31,.18)"></div>
        </div>
        <h1 class="pp-h" style="margin:0 0 6px;font-weight:800;font-size:27px">
          {t.entry.successTitle}
        </h1>
        <p style="margin:0 0 22px;font-family:var(--font-body);font-size:14px;color:rgba(246,241,230,.78)">
          {t.entry.successGreeting(name)}
        </p>
        <div style="background:rgba(255,253,248,.1);border:1px solid rgba(246,241,230,.18);border-radius:18px;padding:18px">
          <div
            class="pp-mono"
            style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:rgba(246,241,230,.6);margin-bottom:8px"
          >
            {t.entry.placementLabel}
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px">
            <span class="pp-score" style="font-size:52px;line-height:1;color:var(--pp-sunny)">
              {placement.rank}.
            </span>
            <div style="text-align:left">
              <div class="pp-h" style="font-weight:700;font-size:16px;color:var(--pp-cream)">
                {t.entry.outOf(placement.total)}
              </div>
              {placement.placesAhead > 0 ? (
                <div style="display:inline-flex;align-items:center;gap:5px;font-family:var(--font-body);font-weight:600;font-size:12px;color:#8fe6b0;margin-top:2px">
                  <span style="font-size:14px">▲</span> {placement.placesAhead}{' '}
                  {t.entry.places(placement.placesAhead)}
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
          {t.entry.toBoard}
        </a>
      </div>
    </div>
  )
}

/** Swappable screen content when the round is not open. */
export const EntryLockedScreen: FC<{ game: Game }> = ({ game }) => {
  const t = useT()
  return (
    <div id="pp-entry-screen" class="pp-screen">
      <div style="padding:44px 28px 38px;text-align:center">
        <div style="width:72px;height:72px;margin:0 auto 20px;border-radius:50%;background:#FBF3DD;border:1px solid #EBD9A8;display:flex;align-items:center;justify-content:center">
          <TrophyMark size={36} />
        </div>
        <h1
          class="pp-h"
          style="margin:0 0 8px;font-weight:800;font-size:23px;color:var(--pp-turf-to)"
        >
          {t.entry.lockedTitle}
        </h1>
        <p style="margin:0 0 24px;font-family:var(--font-body);font-size:14px;color:var(--pp-text-soft);line-height:1.5">
          {t.entry.lockedBody}
        </p>
        <a
          href={`/g/${game.publicId}/board`}
          class="pp-btn pp-btn--dark pp-btn--block"
          style="font-size:17px;padding:15px"
        >
          {t.entry.toBoard}
        </a>
      </div>
    </div>
  )
}

// ---- Full-page wrappers ----

export const EntryPage: FC<EntryFormProps> = (props) => {
  const t = useT()
  return (
    <Layout
      title={`${props.game.name} · ${t.entry.titleSuffix}`}
      bodyClass="pp-body--entry"
      htmx
      scripts={['/entry.js']}
    >
      <EntryFormScreen {...props} />
    </Layout>
  )
}

export const EntrySuccessPage: FC<{
  game: Game
  name: string
  strokes: number
  placement: Placement
}> = (props) => {
  const t = useT()
  return (
    <Layout
      title={`${props.game.name} · ${t.entry.successSuffix}`}
      bodyClass="pp-body--entry"
      htmx
      scripts={['/entry.js']}
    >
      <EntrySuccessScreen {...props} />
    </Layout>
  )
}

export const EntryLockedPage: FC<{ game: Game }> = ({ game }) => {
  const t = useT()
  return (
    <Layout title={`${game.name} · ${t.entry.lockedSuffix}`} bodyClass="pp-body--entry">
      <EntryLockedScreen game={game} />
    </Layout>
  )
}
