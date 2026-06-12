import type { Child, FC } from 'hono/jsx'
import type { AdminIdentity } from '../../bindings'
import type { GameWithCount } from '../../db/queries'
import { isoToGerman } from '../../lib/dates'
import { Layout } from '../layout'
import { BrandBadge, GolfBall, StatusBadge } from '../primitives'
import { CreateGameModal } from './GameForm'

const STATUS_ACCENT: Record<GameWithCount['status'], string> = {
  open: 'var(--pp-turf-from)',
  locked: 'var(--pp-flag)',
  archived: 'var(--pp-silver)',
}

export const AdminHeader: FC<{
  admin: AdminIdentity
  logoutUrl: string
  subtitle: string
  action?: Child
}> = ({ admin, logoutUrl, subtitle, action }) => (
  <div class="pp-admin-head">
    <BrandBadge size={40} />
    <div>
      <div
        class="pp-h"
        style="font-weight:800;font-size:20px;line-height:1;color:var(--pp-turf-to)"
      >
        Putt Party{' '}
        <span style="font-weight:600;font-size:14px;color:var(--pp-text-faint)">· Admin</span>
      </div>
      <div style="font-family:var(--font-body);font-size:12px;color:var(--pp-text-soft);margin-top:3px">
        {subtitle}
      </div>
    </div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="pp-whoami">
        <span style="display:inline-flex;width:7px;height:7px;border-radius:50%;background:var(--pp-turf-from)" />
        Angemeldet: {admin.name}
        <a
          href={logoutUrl}
          style="background:#ECE9DF;border-radius:999px;padding:4px 10px;font-family:var(--font-head);font-weight:600;font-size:12px;color:var(--pp-text-soft);text-decoration:none"
        >
          Logout
        </a>
      </div>
      {action}
    </div>
  </div>
)

export const GameCard: FC<{ game: GameWithCount; baseUrl: string }> = ({ game, baseUrl }) => {
  const archived = game.status === 'archived'
  const meta = [isoToGerman(game.date), game.location].filter(Boolean).join(' · ')
  const entryUrl = `${baseUrl}/g/${game.publicId}`
  return (
    <div
      class={`pp-game-card${archived ? ' pp-game-card--archived' : ''}`}
      data-entry-id={game.publicId}
    >
      <div class="pp-card-accent" style={`background:${STATUS_ACCENT[game.status]}`} />
      <div style="padding:18px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px">
          <div>
            <div
              class="pp-h"
              style={`font-weight:700;font-size:19px;line-height:1.1;color:${archived ? 'var(--pp-text-muted)' : 'var(--pp-ink)'}`}
            >
              {game.name}
            </div>
            <div style="font-family:var(--font-body);font-size:12.5px;color:var(--pp-text-soft);margin-top:2px">
              {meta}
            </div>
          </div>
          <StatusBadge status={game.status} />
        </div>
        <div style="display:flex;align-items:center;gap:7px;font-family:var(--font-body);font-size:13px;color:var(--pp-text-muted);margin-bottom:16px">
          <GolfBall size={12} />
          <strong class="pp-h" style="font-weight:700">
            {game.entryCount}
          </strong>{' '}
          Teilnehmer:innen
        </div>
        <div style="display:flex;gap:8px">
          {archived ? (
            <a
              href={`/g/${game.publicId}/board`}
              class="pp-btn pp-btn--outline pp-btn--sm"
              style="flex:1"
            >
              Bestenliste ansehen
            </a>
          ) : (
            <>
              <a
                href={`/admin/games/${game.publicId}`}
                class="pp-btn pp-btn--dark pp-btn--sm"
                style="flex:1"
              >
                Verwalten
              </a>
              <a href={`/g/${game.publicId}/board`} class="pp-btn pp-btn--secondary pp-btn--sm">
                Bestenliste
              </a>
              <button
                type="button"
                class="pp-btn pp-btn--outline pp-btn--sm"
                title="Link kopieren"
                aria-label="Link zur Eintrag-Seite kopieren"
                data-copy={entryUrl}
                data-copy-label="Link zur Eintrag-Seite kopiert"
              >
                🔗
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const NewGameCard: FC = () => (
  <button type="button" class="pp-newcard" data-open-modal="pp-create-modal">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--pp-flag);color:var(--pp-card);font-size:24px;box-shadow:0 4px 0 var(--pp-flag-press)">
      ＋
    </span>
    Neues Spiel anlegen
  </button>
)

const EmptyDashboard: FC = () => (
  <div
    class="pp-card"
    style="border-radius:16px;text-align:center;padding:48px 36px;box-shadow:0 12px 30px rgba(20,68,47,.12)"
  >
    <div style="position:relative;width:84px;height:56px;margin:0 auto 22px">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:80px;height:22px;border-radius:50%;background:rgba(22,38,31,.12)" />
      <div style="position:absolute;bottom:12px;left:34px;width:3px;height:42px;background:#16261F;border-radius:2px" />
      <div style="position:absolute;bottom:42px;left:37px;width:22px;height:15px;background:#E2533B;clip-path:polygon(0 0,100% 50%,0 100%);transform-origin:left center;animation:pp-wave 2.4s ease-in-out infinite" />
    </div>
    <h2 class="pp-h" style="margin:0 0 8px;font-weight:800;font-size:24px;color:var(--pp-turf-to)">
      Noch kein Spiel angelegt
    </h2>
    <p style="margin:0 0 22px;font-family:var(--font-body);font-size:14px;color:var(--pp-text-soft);line-height:1.5">
      Erstelle dein erstes Turnier — danach erhalten deine Gäste einen QR-Code zum Eintragen.
    </p>
    <button
      type="button"
      class="pp-btn pp-btn--primary pp-btn--lg"
      data-open-modal="pp-create-modal"
    >
      ＋ Erstes Spiel anlegen
    </button>
  </div>
)

export const DashboardPage: FC<{
  admin: AdminIdentity
  logoutUrl: string
  baseUrl: string
  games: GameWithCount[]
}> = ({ admin, logoutUrl, baseUrl, games }) => {
  const totalPlayers = games.reduce((sum, g) => sum + g.entryCount, 0)
  const subtitle = `${games.length} ${games.length === 1 ? 'Spiel' : 'Spiele'} · ${totalPlayers} Teilnehmer:innen gesamt`
  return (
    <Layout
      title="Dashboard · Putt Party Admin"
      bodyClass="pp-body--admin"
      htmx
      scripts={['/admin.js']}
    >
      <div class="pp-admin-wrap">
        <AdminHeader
          admin={admin}
          logoutUrl={logoutUrl}
          subtitle={subtitle}
          action={
            <button type="button" class="pp-btn pp-btn--primary" data-open-modal="pp-create-modal">
              ＋ Neues Spiel
            </button>
          }
        />

        {games.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <div class="pp-cards-grid">
            {games.map((game) => (
              <GameCard key={game.publicId} game={game} baseUrl={baseUrl} />
            ))}
            <NewGameCard />
          </div>
        )}
      </div>
      <CreateGameModal createPath="/admin/games" />
    </Layout>
  )
}
