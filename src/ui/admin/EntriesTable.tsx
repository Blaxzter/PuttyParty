import type { FC } from 'hono/jsx'
import type { Entry, Game } from '../../db/schema'
import { computeStandings } from '../../lib/ranking'
import { FieldError } from '../primitives'
import { medalColor } from '../tokens'

export interface RowDraft {
  name?: string
  team?: string
  strokes?: string
}

export interface EntriesTableProps {
  game: Game
  entries: Entry[]
  /** URL prefix for hx endpoints, e.g. "/admin/games/sf26" or "/m/<token>". */
  basePath: string
  editId?: number
  addMode?: boolean
  draft?: RowDraft
  errors?: Record<string, string>
}

function RankChip({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span
        class="pp-h"
        style={`display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${medalColor(rank)};color:#fff;font-weight:700;font-size:13px`}
      >
        {rank}
      </span>
    )
  }
  return (
    <span
      class="pp-h"
      style="display:inline-flex;align-items:center;justify-content:center;width:28px;font-weight:700;font-size:15px;color:var(--pp-text-muted)"
    >
      {rank}
    </span>
  )
}

const actionsCol = (basePath: string, entry: Entry) => (
  <span style="display:flex;gap:6px;justify-content:flex-end">
    <button
      type="button"
      class="pp-iconbtn"
      title="Bearbeiten"
      aria-label={`Eintrag von ${entry.name} bearbeiten`}
      hx-get={`${basePath}/entries?edit=${entry.id}`}
      hx-target="#pp-entries"
      hx-swap="outerHTML"
    >
      ✎
    </button>
    <button
      type="button"
      class="pp-iconbtn pp-iconbtn--del"
      title="Löschen"
      aria-label={`Eintrag von ${entry.name} löschen`}
      hx-delete={`${basePath}/entries/${entry.id}`}
      hx-target="#pp-entries"
      hx-swap="outerHTML"
      hx-confirm={`Eintrag von ${entry.name} löschen?`}
    >
      🗑
    </button>
  </span>
)

const DisplayRow: FC<{ basePath: string; entry: Entry; rank: number }> = ({
  basePath,
  entry,
  rank,
}) => (
  <div class="pp-entries-row" data-entry-id={entry.id}>
    <RankChip rank={rank} />
    <span class="pp-h" style="font-weight:700;font-size:15px;color:var(--pp-ink)">
      {entry.name}
    </span>
    <span style="font-family:var(--font-body);font-size:13px;color:var(--pp-text-soft)">
      {entry.team ?? ''}
    </span>
    <span
      class="pp-score"
      style="text-align:right;font-size:22px;color:var(--pp-ink)"
      data-role="score"
    >
      {entry.strokes}
    </span>
    {actionsCol(basePath, entry)}
  </div>
)

const EditRow: FC<{
  basePath: string
  entry: Entry
  rank: number
  draft?: RowDraft
  errors?: Record<string, string>
}> = ({ basePath, entry, rank, draft, errors }) => (
  <form
    class="pp-entries-row pp-entries-row--edit"
    hx-patch={`${basePath}/entries/${entry.id}`}
    hx-target="#pp-entries"
    hx-swap="outerHTML"
  >
    <RankChip rank={rank} />
    <input
      name="name"
      value={draft?.name ?? entry.name}
      class={`pp-input ${errors?.name ? 'pp-input--invalid' : ''}`}
      style="padding:7px 9px;border-radius:8px;border-color:var(--pp-turf-from)"
    />
    <input
      name="team"
      value={draft?.team ?? entry.team ?? ''}
      placeholder="Team"
      class="pp-input"
      style="padding:7px 9px;border-radius:8px;font-size:13px"
    />
    <input
      name="strokes"
      type="number"
      value={draft?.strokes ?? String(entry.strokes)}
      class={`pp-input pp-input--score ${errors?.strokes ? 'pp-input--invalid' : ''}`}
      style="text-align:right;font-size:18px;padding:5px 8px;border-radius:8px"
    />
    <span style="display:flex;gap:6px;justify-content:flex-end">
      <button
        type="submit"
        class="pp-iconbtn pp-iconbtn--ok"
        title="Speichern"
        aria-label="Speichern"
      >
        ✓
      </button>
      <button
        type="button"
        class="pp-iconbtn"
        title="Abbrechen"
        aria-label="Bearbeiten abbrechen"
        hx-get={`${basePath}/entries`}
        hx-target="#pp-entries"
        hx-swap="outerHTML"
      >
        ✕
      </button>
    </span>
  </form>
)

const AddRow: FC<{ basePath: string; draft?: RowDraft; errors?: Record<string, string> }> = ({
  basePath,
  draft,
  errors,
}) => (
  <form
    class="pp-entries-row pp-entries-row--edit"
    hx-post={`${basePath}/entries`}
    hx-target="#pp-entries"
    hx-swap="outerHTML"
  >
    <span
      class="pp-h"
      style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--pp-turf-from);color:#fff;font-size:15px"
    >
      ＋
    </span>
    <input
      name="name"
      value={draft?.name ?? ''}
      placeholder="Name"
      autofocus
      class={`pp-input ${errors?.name ? 'pp-input--invalid' : ''}`}
      style="padding:7px 9px;border-radius:8px;border-color:var(--pp-turf-from)"
    />
    <input
      name="team"
      value={draft?.team ?? ''}
      placeholder="Team"
      class="pp-input"
      style="padding:7px 9px;border-radius:8px;font-size:13px"
    />
    <input
      name="strokes"
      type="number"
      value={draft?.strokes ?? ''}
      placeholder="–"
      class={`pp-input pp-input--score ${errors?.strokes ? 'pp-input--invalid' : ''}`}
      style="text-align:right;font-size:18px;padding:5px 8px;border-radius:8px"
    />
    <span style="display:flex;gap:6px;justify-content:flex-end">
      <button
        type="submit"
        class="pp-iconbtn pp-iconbtn--ok"
        title="Hinzufügen"
        aria-label="Eintrag hinzufügen"
      >
        ✓
      </button>
      <button
        type="button"
        class="pp-iconbtn"
        title="Abbrechen"
        aria-label="Hinzufügen abbrechen"
        hx-get={`${basePath}/entries`}
        hx-target="#pp-entries"
        hx-swap="outerHTML"
      >
        ✕
      </button>
    </span>
  </form>
)

export const EntriesTable: FC<EntriesTableProps> = ({
  game,
  entries,
  basePath,
  editId,
  addMode,
  draft,
  errors,
}) => {
  const standings = computeStandings(
    entries.map((e) => ({ id: e.id, name: e.name, team: e.team, strokes: e.strokes })),
  )
  const rankById = new Map(standings.map((s) => [s.entry.id, s.rank]))
  const rowError = errors && Object.keys(errors).length > 0 ? Object.values(errors)[0] : undefined
  // game retained for future per-game rendering hints (e.g. teamsEnabled).
  void game

  return (
    <div id="pp-entries" class="pp-card" style="overflow:hidden">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid #ece5d3">
        <div class="pp-h" style="font-weight:700;font-size:17px;color:var(--pp-ink)">
          Einträge{' '}
          <span style="color:var(--pp-text-faint);font-weight:600">· {entries.length}</span>
        </div>
        {addMode ? null : (
          <button
            type="button"
            class="pp-btn pp-btn--dark pp-btn--sm"
            style="margin-left:auto"
            hx-get={`${basePath}/entries?add=1`}
            hx-target="#pp-entries"
            hx-swap="outerHTML"
          >
            ＋ Eintrag hinzufügen
          </button>
        )}
      </div>

      <div
        class="pp-mono"
        style="display:grid;grid-template-columns:44px 1fr 130px 70px 74px;gap:10px;padding:10px 20px;background:var(--pp-panel-head);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--pp-silver)"
      >
        <span>Rang</span>
        <span>Name</span>
        <span>Team</span>
        <span style="text-align:right">Schläge</span>
        <span />
      </div>

      {addMode ? <AddRow basePath={basePath} draft={draft} errors={errors} /> : null}

      {rowError && (addMode || editId) ? (
        <div style="padding:4px 20px 0">
          <FieldError message={rowError} />
        </div>
      ) : null}

      {entries.length === 0 && !addMode ? (
        <div style="text-align:center;padding:28px;font-family:var(--font-body);font-size:13px;color:var(--pp-text-soft)">
          Noch keine Einträge. Füge den ersten hinzu oder teile den QR-Code.
        </div>
      ) : (
        entries.map((entry) =>
          editId === entry.id ? (
            <EditRow
              key={entry.id}
              basePath={basePath}
              entry={entry}
              rank={rankById.get(entry.id) ?? 0}
              draft={draft}
              errors={errors}
            />
          ) : (
            <DisplayRow
              key={entry.id}
              basePath={basePath}
              entry={entry}
              rank={rankById.get(entry.id) ?? 0}
            />
          ),
        )
      )}
    </div>
  )
}
