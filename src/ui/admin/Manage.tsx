import type { Child, FC } from 'hono/jsx'
import type { Entry, Game } from '../../db/schema'
import { Layout } from '../layout'
import { QrImg } from '../primitives'
import { EntriesTable } from './EntriesTable'
import { GameFormBody } from './GameForm'

export const StatusToggle: FC<{ game: Game; basePath: string }> = ({ game, basePath }) => (
  <div id="pp-status-seg" class="pp-seg" style="width:200px">
    <button
      type="button"
      aria-pressed={game.status === 'open' ? 'true' : 'false'}
      hx-patch={basePath}
      hx-vals='{"status":"open"}'
      hx-target="#pp-status-seg"
      hx-swap="outerHTML"
    >
      Offen
    </button>
    <button
      type="button"
      aria-pressed={game.status === 'locked' ? 'true' : 'false'}
      hx-patch={basePath}
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

const DangerCell: FC<{ title: string; note: string; children: Child }> = ({
  title,
  note,
  children,
}) => (
  <div style="flex:1;min-width:240px;display:flex;align-items:center;gap:12px">
    <div style="flex:1">
      <div class="pp-h" style="font-weight:600;font-size:14px;color:var(--pp-ink)">
        {title}
      </div>
      <div style="font-family:var(--font-body);font-size:12px;color:#8a6258">{note}</div>
    </div>
    {children}
  </div>
)

const DangerZone: FC<{ basePath: string }> = ({ basePath }) => (
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
      <DangerCell
        title="Alle Einträge zurücksetzen"
        note="Bestätigung erforderlich · nicht umkehrbar"
      >
        <button
          type="button"
          class="pp-btn pp-btn--sm"
          style="background:var(--pp-card);color:var(--pp-red-text);border:1.5px solid #e2a497"
          hx-post={`${basePath}/reset`}
          hx-target="#pp-entries"
          hx-swap="outerHTML"
          hx-confirm="Wirklich ALLE Einträge dieses Spiels löschen?"
        >
          Zurücksetzen
        </button>
      </DangerCell>
      <DangerCell title="Spiel archivieren" note="Nimmt keine neuen Scores mehr an">
        <button
          type="button"
          class="pp-btn pp-btn--outline pp-btn--sm"
          style="color:var(--pp-red-text);border-color:#e2a497"
          hx-patch={basePath}
          hx-vals='{"status":"archived"}'
          hx-swap="none"
          hx-confirm="Spiel archivieren? Es nimmt keine neuen Scores mehr an."
        >
          Archivieren
        </button>
      </DangerCell>
      <DangerCell title="Spiel löschen" note="Unwiderruflich · alle Daten weg">
        <button
          type="button"
          class="pp-btn pp-btn--danger-solid pp-btn--sm"
          hx-delete={basePath}
          hx-swap="none"
          hx-confirm="Spiel UNWIDERRUFLICH löschen? Alle Einträge gehen verloren."
        >
          Löschen
        </button>
      </DangerCell>
    </div>
  </div>
)

const OwnerBanner: FC<{ manageUrl: string }> = ({ manageUrl }) => (
  <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FBF3DD;border:1.5px solid #ecd9a3;border-radius:16px;padding:16px 20px;margin-bottom:22px">
    <span style="font-size:22px">🔑</span>
    <div style="flex:1;min-width:220px">
      <div class="pp-h" style="font-weight:700;font-size:15px;color:var(--pp-turf-to)">
        Dein Verwaltungs-Link — speichere ihn!
      </div>
      <div style="font-family:var(--font-body);font-size:12.5px;color:var(--pp-text-muted);margin:2px 0 6px">
        Nur über diesen Link kommst du wieder hierher und kannst dein Spiel verwalten.
      </div>
      <div class="pp-mono" style="font-size:11px;color:var(--pp-text-soft);word-break:break-all">
        {manageUrl}
      </div>
    </div>
    <button
      type="button"
      class="pp-btn pp-btn--primary pp-btn--sm"
      data-copy={manageUrl}
      data-copy-label="Verwaltungs-Link kopiert"
    >
      Link kopieren
    </button>
  </div>
)

export interface ManagePageProps {
  game: Game
  entries: Entry[]
  baseUrl: string
  /** hx prefix for this game's management, e.g. "/admin/games/<id>" or "/m/<token>". */
  basePath: string
  /** Optional back-link (org admin); omitted for self-service. */
  backLink?: { href: string; label: string }
  /** Present for self-service: shows the save-this-link banner. */
  owner?: { manageUrl: string }
}

export const ManagePage: FC<ManagePageProps> = ({
  game,
  entries,
  baseUrl,
  basePath,
  backLink,
  owner,
}) => (
  <Layout
    title={`${game.name} · Verwalten`}
    bodyClass="pp-body--admin"
    htmx
    scripts={['/admin.js']}
  >
    <div class="pp-admin-wrap pp-no-print">
      {owner ? <OwnerBanner manageUrl={owner.manageUrl} /> : null}

      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
        <div>
          <a
            href={backLink?.href ?? '/'}
            class="pp-mono"
            style="font-size:11px;color:var(--pp-text-faint);text-decoration:none"
          >
            {backLink?.label ?? 'Spiel verwalten'}
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
              Status:
            </span>
            <StatusToggle game={game} basePath={basePath} />
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
        <EntriesTable game={game} entries={entries} basePath={basePath} />
      </div>

      <DangerZone basePath={basePath} />
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
          <GameFormBody mode="edit" game={game} basePath={basePath} />
        </div>
      </div>
    </div>
  </Layout>
)
