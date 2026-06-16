import type { FC } from 'hono/jsx'
import type { Game } from '../../db/schema'
import { LOCALE_LABEL, LOCALES, useT } from '../../i18n'
import { DateField, Field } from '../primitives'

export interface GameFormValues {
  name?: string
  date?: string
  location?: string
  holes?: string
  entryMode?: 'total' | 'per_hole'
  teamsEnabled?: boolean
  status?: 'open' | 'locked'
  locale?: 'de' | 'en'
}

export interface GameFormProps {
  mode: 'create' | 'edit'
  /** POST target in create mode, e.g. "/games" (public) or "/admin/games". */
  createPath?: string
  /** PATCH target in edit mode, e.g. "/m/<token>" or "/admin/games/<id>". */
  basePath?: string
  game?: Game
  values?: GameFormValues
  errors?: Record<string, string>
  /** When set, renders a Cloudflare Turnstile widget in the form (public create). */
  turnstileSiteKey?: string
  /** Optional banner shown at the top of the form (e.g. failed bot check). */
  alert?: string
}

function resolve(props: GameFormProps): Required<GameFormValues> {
  const { values: v, game } = props
  return {
    name: v?.name ?? game?.name ?? '',
    date: v?.date ?? game?.date ?? '',
    location: v?.location ?? game?.location ?? '',
    holes: v?.holes ?? String(game?.holes ?? 9),
    entryMode: v?.entryMode ?? game?.entryMode ?? 'total',
    teamsEnabled: v?.teamsEnabled ?? (game ? game.teamsEnabled : true),
    status: v?.status ?? (game?.status === 'locked' ? 'locked' : 'open'),
    locale: v?.locale ?? game?.locale ?? 'de',
  }
}

/** Inner content of #pp-modal-body for both create and edit. */
export const GameFormBody: FC<GameFormProps> = (props) => {
  const t = useT()
  const v = resolve(props)
  const errors = props.errors ?? {}
  const submit =
    props.mode === 'create'
      ? { 'hx-post': props.createPath ?? '/admin/games' }
      : { 'hx-patch': props.basePath ?? `/admin/games/${props.game?.publicId}` }

  return (
    <>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 26px 16px;border-bottom:2px dashed #e2dac4">
        <h3 class="pp-h" style="margin:0;font-weight:800;font-size:22px;color:var(--pp-turf-to)">
          {props.mode === 'create' ? t.gameForm.createTitle : t.gameForm.editTitle}
        </h3>
        <button
          type="button"
          data-close-modal
          aria-label={t.gameForm.close}
          style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;border:none;background:#F1ECE0;color:#6B7B6E;font-size:16px;cursor:pointer"
        >
          ✕
        </button>
      </div>

      <form {...submit} hx-target="#pp-modal-body" hx-swap="innerHTML">
        <div style="padding:22px 26px">
          {props.alert ? (
            <div
              role="alert"
              style="margin-bottom:16px;padding:11px 14px;border-radius:11px;background:#fbeae6;border:1.5px solid #f0c2b7;color:#b3402b;font-family:var(--font-body);font-size:13px"
            >
              {props.alert}
            </div>
          ) : null}
          <div class="pp-form-grid" style="margin-bottom:16px">
            <div class="pp-form-grid__full">
              <Field
                name="name"
                label={t.gameForm.name}
                required
                value={v.name}
                error={errors.name}
              />
            </div>
            <DateField
              name="date"
              label={t.gameForm.date}
              required
              value={v.date}
              error={errors.date}
            />
            <Field
              name="location"
              label={t.gameForm.location}
              optional
              value={v.location}
              error={errors.location}
            />
            <label class="pp-label">
              <span>{t.gameForm.language}</span>
              <select name="locale" class="pp-input">
                {LOCALES.map((l) => (
                  <option key={l} value={l} selected={v.locale === l}>
                    {LOCALE_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span class="pp-field-label">{t.gameForm.capture}</span>
              <div class="pp-seg pp-seg--radio" data-entry-mode>
                <label>
                  <input
                    type="radio"
                    name="entryMode"
                    value="total"
                    checked={v.entryMode === 'total'}
                  />
                  {t.gameForm.totalMode}
                </label>
                <label>
                  <input
                    type="radio"
                    name="entryMode"
                    value="per_hole"
                    checked={v.entryMode === 'per_hole'}
                  />
                  {t.gameForm.perHoleMode}
                </label>
              </div>
            </div>
            <div data-holes-field hidden={v.entryMode === 'total'}>
              <Field
                name="holes"
                label={t.gameForm.holesCount}
                type="number"
                inputMode="numeric"
                value={v.holes}
                error={errors.holes}
                inputClass="pp-input--score"
              />
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;background:var(--pp-cream);border:1.5px solid var(--pp-border-input);border-radius:11px;padding:12px 14px;margin-bottom:16px">
            <span style="font-family:var(--font-body);font-size:14px;color:var(--pp-ink)">
              {t.gameForm.scoring}
            </span>
            <span class="pp-mono" style="margin-left:auto;font-size:10px;color:var(--pp-silver)">
              {t.gameForm.scoringFixed}
            </span>
          </div>

          <div class="pp-form-row">
            <div style="flex:1;display:flex;align-items:center;gap:12px;background:var(--pp-cream);border:1.5px solid var(--pp-border-input);border-radius:11px;padding:12px 14px">
              <div>
                <div class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-ink)">
                  {t.gameForm.teams}
                </div>
                <div style="font-family:var(--font-body);font-size:11.5px;color:var(--pp-text-soft)">
                  {t.gameForm.teamsHint}
                </div>
              </div>
              <label class="pp-switch-field" style="margin-left:auto">
                <input type="checkbox" name="teamsEnabled" checked={v.teamsEnabled} />
                <span class="knob" />
              </label>
            </div>
            <div style="flex:1">
              <span class="pp-field-label">{t.gameForm.status}</span>
              <div class="pp-seg pp-seg--radio">
                <label>
                  <input type="radio" name="status" value="open" checked={v.status === 'open'} />
                  {t.gameForm.statusOpen}
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="locked"
                    checked={v.status === 'locked'}
                  />
                  {t.gameForm.statusLocked}
                </label>
              </div>
            </div>
          </div>

          {props.turnstileSiteKey ? (
            <div
              class="cf-turnstile"
              style="margin-top:16px"
              data-sitekey={props.turnstileSiteKey}
              data-theme="light"
              data-size="flexible"
            />
          ) : null}
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding:16px 26px 22px;border-top:2px dashed #e2dac4">
          <button
            type="button"
            data-close-modal
            class="pp-btn pp-btn--ghost"
            style="margin-left:auto"
          >
            {t.gameForm.cancel}
          </button>
          <button type="submit" class="pp-btn pp-btn--primary">
            {t.gameForm.save}
          </button>
        </div>
      </form>
    </>
  )
}

/** The hidden modal shell that hosts the create form (dashboard or landing). */
export const CreateGameModal: FC<{ createPath: string; turnstileSiteKey?: string }> = ({
  createPath,
  turnstileSiteKey,
}) => (
  <div class="pp-modal-backdrop" id="pp-create-modal">
    <div class="pp-modal">
      <div id="pp-modal-body">
        <GameFormBody mode="create" createPath={createPath} turnstileSiteKey={turnstileSiteKey} />
      </div>
    </div>
  </div>
)
