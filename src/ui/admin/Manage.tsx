import type { FC } from 'hono/jsx'
import type { Entry, Game } from '../../db/schema'
import { Layout } from '../layout'
import { QrImg } from '../primitives'
import { EntriesTable } from './EntriesTable'
import { GameFormBody } from './GameForm'

export const StatusToggle: FC<{ game: Game }> = ({ game }) => (
  <div id="pp-status-seg" class="pp-seg" style="width:200px">
    <button
      type="button"
      aria-pressed={game.status === 'open' ? 'true' : 'false'}
      hx-patch={`/admin/games/${game.publicId}`}
      hx-vals='{"status":"open"}'
      hx-target="#pp-status-seg"
      hx-swap="outerHTML"
    >
      Offen
    </button>
    <button
      type="button"
      aria-pressed={game.status === 'locked' ? 'true' : 'false'}
      hx-patch={`/admin/games/${game.publicId}`}
      hx-vals='{"status":"locked"}'
      hx-target="#pp-status-seg"
      hx-swap="outerHTML"
    >
      Gesperrt
    </button>
  </div>
)

const ShareColumn: FC<{ game: Game; baseUrl: string }> = ({ game, baseUrl }) => {
  const entryUrl = `${baseUrl}/g/${game.publicId}`
  const boardUrl = `${baseUrl}/g/${game.publicId}/board`
  return (
    <div class="pp-card" style="padding:22px">
      <div
        class="pp-h"
        style="font-weight:700;font-size:17px;color:var(--pp-ink);margin-bottom:4px"
      >
        Teilen
      </div>
      <p style="margin:0 0 18px;font-family:var(--font-body);font-size:12.5px;color:var(--pp-text-soft);line-height:1.45">
        QR-Codes &amp; Links für Spieler:innen und den Bildschirm.
      </p>

      <div style="background:var(--pp-cream);border:1px dashed #cfc6ac;border-radius:16px;padding:18px;text-align:center;margin-bottom:14px">
        <div
          class="pp-h"
          style="font-weight:700;font-size:13px;color:var(--pp-green-text);margin-bottom:12px"
        >
          Eintrag-Seite · zum Aushängen
        </div>
        <div style="display:flex;justify-content:center">
          <QrImg publicId={game.publicId} target="entry" size={168} />
        </div>
        <div
          class="pp-mono"
          style="font-size:10.5px;color:var(--pp-text-soft);margin:12px 0 14px;word-break:break-all"
        >
          {entryUrl}
        </div>
        <div style="display:flex;gap:8px">
          <button
            type="button"
            class="pp-btn pp-btn--danger-solid pp-btn--sm"
            style="flex:1"
            data-copy={entryUrl}
            data-copy-label="Link zur Eintrag-Seite kopiert"
          >
            Link kopieren
          </button>
          <button type="button" class="pp-btn pp-btn--outline pp-btn--sm" data-print>
            Drucken
          </button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:14px;background:var(--pp-cream);border:1px dashed #cfc6ac;border-radius:16px;padding:14px">
        <QrImg publicId={game.publicId} target="board" size={76} rounded={11} />
        <div style="flex:1;min-width:0">
          <div class="pp-h" style="font-weight:700;font-size:13px;color:var(--pp-ink)">
            Bestenliste · Bildschirm
          </div>
          <div
            class="pp-mono"
            style="font-size:10px;color:var(--pp-text-soft);margin:2px 0 8px;word-break:break-all"
          >
            {boardUrl}
          </div>
          <button
            type="button"
            class="pp-btn pp-btn--secondary pp-btn--sm"
            data-copy={boardUrl}
            data-copy-label="Link zur Bestenliste kopiert"
          >
            Link kopieren
          </button>
        </div>
      </div>
    </div>
  )
}

const DangerZone: FC<{ game: Game }> = ({ game }) => (
  <div class="pp-danger-zone">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--pp-flag);color:#fff;font-size:13px;font-weight:700">
        !
      </span>
      <span class="pp-h" style="font-weight:700;font-size:16px;color:var(--pp-red-text)">
        Gefahrenzone
      </span>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:240px;display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <div class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-ink)">
            Alle Einträge zurücksetzen
          </div>
          <div style="font-family:var(--font-body);font-size:12px;color:#8a6258">
            Bestätigung erforderlich · nicht umkehrbar
          </div>
        </div>
        <button
          type="button"
          class="pp-btn pp-btn--sm"
          style="background:var(--pp-card);color:var(--pp-red-text);border:1.5px solid #e2a497"
          hx-post={`/admin/games/${game.publicId}/reset`}
          hx-target="#pp-entries"
          hx-swap="outerHTML"
          hx-confirm="Wirklich ALLE Einträge dieses Spiels löschen?"
        >
          Zurücksetzen
        </button>
      </div>
      <div style="flex:1;min-width:240px;display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <div class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-ink)">
            Spiel archivieren
          </div>
          <div style="font-family:var(--font-body);font-size:12px;color:#8a6258">
            Bestätigung erforderlich
          </div>
        </div>
        <button
          type="button"
          class="pp-btn pp-btn--danger-solid pp-btn--sm"
          hx-patch={`/admin/games/${game.publicId}`}
          hx-vals='{"status":"archived"}'
          hx-swap="none"
          hx-confirm="Spiel archivieren? Es nimmt keine neuen Scores mehr an."
        >
          Archivieren
        </button>
      </div>
    </div>
  </div>
)

export const ManagePage: FC<{ game: Game; entries: Entry[]; baseUrl: string }> = ({
  game,
  entries,
  baseUrl,
}) => (
  <Layout
    title={`${game.name} · Verwalten`}
    bodyClass="pp-body--admin"
    htmx
    scripts={['/admin.js']}
  >
    <div class="pp-admin-wrap pp-no-print">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
        <div>
          <a
            href="/admin"
            class="pp-mono"
            style="font-size:11px;color:var(--pp-text-faint);text-decoration:none"
          >
            ← Dashboard · Spiel verwalten
          </a>
          <div style="display:flex;align-items:center;gap:10px">
            <h2
              class="pp-h"
              style="margin:0;font-weight:800;font-size:26px;color:var(--pp-turf-to)"
            >
              {game.name}
            </h2>
            <button
              type="button"
              class="pp-iconbtn"
              title="Einstellungen bearbeiten"
              aria-label="Spieleinstellungen bearbeiten"
              data-open-modal="pp-edit-modal"
            >
              ✎
            </button>
          </div>
        </div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:9px">
            <span class="pp-h" style="font-weight:600;font-size:13px;color:var(--pp-text-soft)">
              Einträge:
            </span>
            <StatusToggle game={game} />
          </div>
          <a
            href={`/g/${game.publicId}/board`}
            class="pp-btn pp-btn--secondary"
            style="background:var(--pp-card)"
          >
            Bestenliste öffnen →
          </a>
        </div>
      </div>

      <div class="pp-manage-grid">
        <ShareColumn game={game} baseUrl={baseUrl} />
        <EntriesTable game={game} entries={entries} />
      </div>

      <DangerZone game={game} />
    </div>

    {/* Print sheet (visible only when printing the entry QR) */}
    <div class="pp-print-only" style="text-align:center;padding:40px">
      <h1 class="pp-h" style="font-weight:800;font-size:30px;color:var(--pp-turf-to)">
        {game.name}
      </h1>
      <p style="font-family:var(--font-body);font-size:16px;margin:8px 0 20px">
        Scanne den QR-Code und trag deinen Score ein!
      </p>
      <div style="display:flex;justify-content:center">
        <QrImg publicId={game.publicId} target="entry" size={320} />
      </div>
      <div class="pp-mono" style="margin-top:16px;font-size:14px">
        {baseUrl}/g/{game.publicId}
      </div>
    </div>

    {/* Edit-settings modal */}
    <div class="pp-modal-backdrop" id="pp-edit-modal">
      <div class="pp-modal">
        <div id="pp-modal-body">
          <GameFormBody mode="edit" game={game} />
        </div>
      </div>
    </div>
  </Layout>
)
