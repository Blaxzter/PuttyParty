import type { FC } from 'hono/jsx'
import type { Game } from '../../db/schema'
import { isoToGerman } from '../../lib/dates'
import { Field } from '../primitives'

export interface GameFormValues {
  name?: string
  date?: string
  location?: string
  holes?: string
  entryMode?: 'total' | 'per_hole'
  teamsEnabled?: boolean
  status?: 'open' | 'locked'
}

export interface GameFormProps {
  mode: 'create' | 'edit'
  game?: Game
  values?: GameFormValues
  errors?: Record<string, string>
}

function resolve(props: GameFormProps): Required<GameFormValues> {
  const { values: v, game } = props
  return {
    name: v?.name ?? game?.name ?? '',
    date: v?.date ?? (game ? isoToGerman(game.date) : ''),
    location: v?.location ?? game?.location ?? '',
    holes: v?.holes ?? String(game?.holes ?? 9),
    entryMode: v?.entryMode ?? game?.entryMode ?? 'total',
    teamsEnabled: v?.teamsEnabled ?? (game ? game.teamsEnabled : true),
    status: v?.status ?? (game?.status === 'locked' ? 'locked' : 'open'),
  }
}

/** Inner content of #pp-modal-body for both create and edit. */
export const GameFormBody: FC<GameFormProps> = (props) => {
  const v = resolve(props)
  const errors = props.errors ?? {}
  const submit =
    props.mode === 'create'
      ? { 'hx-post': '/admin/games' }
      : { 'hx-patch': `/admin/games/${props.game?.publicId}` }

  return (
    <>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 26px 16px;border-bottom:2px dashed #e2dac4">
        <h3 class="pp-h" style="margin:0;font-weight:800;font-size:22px;color:var(--pp-turf-to)">
          {props.mode === 'create' ? 'Neues Spiel' : 'Spiel bearbeiten'}
        </h3>
        <button
          type="button"
          data-close-modal
          aria-label="Schließen"
          style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;border:none;background:#F1ECE0;color:#6B7B6E;font-size:16px;cursor:pointer"
        >
          ✕
        </button>
      </div>

      <form {...submit} hx-target="#pp-modal-body" hx-swap="innerHTML">
        <div style="padding:22px 26px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div style="grid-column:span 2">
              <Field name="name" label="Name" required value={v.name} error={errors.name} />
            </div>
            <Field
              name="date"
              label="Datum"
              required
              placeholder="TT.MM.JJJJ"
              value={v.date}
              error={errors.date}
            />
            <Field
              name="location"
              label="Ort"
              optional
              value={v.location}
              error={errors.location}
            />
            <Field
              name="holes"
              label="Anzahl Bahnen"
              type="number"
              inputMode="numeric"
              value={v.holes}
              error={errors.holes}
              inputClass="pp-input--score"
            />
            <div>
              <span class="pp-field-label">Erfassung</span>
              <div class="pp-seg pp-seg--radio">
                <label>
                  <input
                    type="radio"
                    name="entryMode"
                    value="total"
                    checked={v.entryMode === 'total'}
                  />
                  Gesamtschläge
                </label>
                <label>
                  <input
                    type="radio"
                    name="entryMode"
                    value="per_hole"
                    checked={v.entryMode === 'per_hole'}
                  />
                  Pro Bahn
                </label>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;background:var(--pp-cream);border:1.5px solid var(--pp-border-input);border-radius:11px;padding:12px 14px;margin-bottom:16px">
            <span style="font-family:var(--font-body);font-size:14px;color:var(--pp-ink)">
              Wertung: Wenigste Schläge
            </span>
            <span class="pp-mono" style="margin-left:auto;font-size:10px;color:var(--pp-silver)">
              fix
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:16px">
            <div style="flex:1;display:flex;align-items:center;gap:12px;background:var(--pp-cream);border:1.5px solid var(--pp-border-input);border-radius:11px;padding:12px 14px">
              <div>
                <div class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-ink)">
                  Teams / Abteilungen
                </div>
                <div style="font-family:var(--font-body);font-size:11.5px;color:var(--pp-text-soft)">
                  Feld im Formular zeigen
                </div>
              </div>
              <label class="pp-switch-field" style="margin-left:auto">
                <input type="checkbox" name="teamsEnabled" checked={v.teamsEnabled} />
                <span class="knob" />
              </label>
            </div>
            <div style="flex:1">
              <span class="pp-field-label">Status</span>
              <div class="pp-seg pp-seg--radio">
                <label>
                  <input type="radio" name="status" value="open" checked={v.status === 'open'} />
                  Offen
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="locked"
                    checked={v.status === 'locked'}
                  />
                  Gesperrt
                </label>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding:16px 26px 22px;border-top:2px dashed #e2dac4">
          <button
            type="button"
            data-close-modal
            class="pp-btn pp-btn--ghost"
            style="margin-left:auto"
          >
            Abbrechen
          </button>
          <button type="submit" class="pp-btn pp-btn--primary">
            Spiel speichern
          </button>
        </div>
      </form>
    </>
  )
}

/** The hidden modal shell that hosts the create form on the dashboard. */
export const CreateGameModal: FC = () => (
  <div class="pp-modal-backdrop" id="pp-create-modal">
    <div class="pp-modal">
      <div id="pp-modal-body">
        <GameFormBody mode="create" />
      </div>
    </div>
  </div>
)
