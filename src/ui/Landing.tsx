import type { FC } from 'hono/jsx'
import { CreateGameModal } from './admin/GameForm'
import { Layout } from './layout'
import { BrandBadge } from './primitives'

const STEPS = [
  {
    n: 1,
    title: 'Spiel erstellen',
    body: 'Name, Datum, Anzahl Bahnen — fertig. Kein Konto, keine App. Du bekommst sofort einen geheimen Verwaltungs-Link.',
  },
  {
    n: 2,
    title: 'QR-Code teilen',
    body: 'Häng den QR-Code aus oder schick den Link. Spieler:innen tragen ihren Score vom eigenen Handy ein.',
  },
  {
    n: 3,
    title: 'Live mitfiebern',
    body: 'Die Bestenliste aktualisiert sich in Echtzeit auf dem grossen Bildschirm — mit Podium, Rängen und Aufstiegen.',
  },
]

export const LandingPage: FC<{ baseUrl: string }> = () => (
  <Layout
    title="Putt Party — Live-Bestenliste fürs Minigolf-Turnier"
    bodyClass="pp-body--landing"
    htmx
    scripts={['/admin.js']}
  >
    <header class="pp-landing-nav">
      <div class="pp-landing-brand">
        <BrandBadge size={40} withBall />
        Putt Party
      </div>
      <a class="pp-login" href="/admin">
        Organisator-Login
      </a>
    </header>

    <section class="pp-hero">
      <div class="pp-hero-inner">
        <div>
          <h1>
            Live-Bestenliste fürs
            <br />
            Minigolf-Turnier
          </h1>
          <p>
            Erstelle in 30&nbsp;Sekunden ein Spiel, häng den QR-Code auf — und alle sehen die
            Rangliste in Echtzeit auf dem grossen Bildschirm. Kostenlos, ohne App.
          </p>
          <div class="pp-cta-row">
            <button
              type="button"
              class="pp-btn pp-btn--primary pp-btn--lg"
              data-open-modal="pp-create-modal"
            >
              ＋ Spiel erstellen
            </button>
            <a href="#so" class="pp-btn pp-btn--gold pp-btn--lg">
              So funktioniert&apos;s
            </a>
          </div>
        </div>
        <div class="pp-hero-shot">
          <img src="/img/board.png" alt="Live-Bestenliste auf dem grossen Bildschirm" />
        </div>
      </div>
    </section>

    <section id="so" class="pp-section">
      <h2>So funktioniert&apos;s</h2>
      <p class="pp-lead">In drei Schritten vom leeren Platz zur Live-Rangliste.</p>
      <div class="pp-steps">
        {STEPS.map((s) => (
          <div class="pp-step" key={s.n}>
            <span class="num">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>

    <section class="pp-section" style="padding-top:0">
      <div class="pp-feature">
        <div class="pp-feature-img">
          <img src="/img/entry.png" alt="Score-Eingabe auf dem Handy" />
        </div>
        <div>
          <h3>Punkte in Sekunden eintragen</h3>
          <p>
            Spieler:innen scannen den QR-Code und tragen ihren Score selbst ein — als Gesamtschläge
            oder Bahn für Bahn. Mit sofortiger Platzierung und freundlicher Bestätigung.
          </p>
        </div>
      </div>
      <div class="pp-feature">
        <div>
          <h3>Live auf dem grossen Screen</h3>
          <p>
            Wirf die Bestenliste auf Beamer oder TV. Podium, geteilte Ränge und Auf-/Abstiege
            aktualisieren sich live, sobald jemand einen Score einträgt.
          </p>
        </div>
        <div class="pp-feature-img">
          <img src="/img/board.png" alt="Live-Bestenliste mit Podium" />
        </div>
      </div>
    </section>

    <section class="pp-cta-band">
      <div class="pp-cta-band-inner">
        <h2>Bereit für euer Turnier?</h2>
        <button
          type="button"
          class="pp-btn pp-btn--gold pp-btn--lg"
          data-open-modal="pp-create-modal"
        >
          ＋ Jetzt Spiel erstellen
        </button>
      </div>
    </section>

    <footer class="pp-landing-foot">
      <BrandBadge size={22} />
      Putt Party · Live-Bestenliste fürs Minigolf-Turnier · <a href="/admin">Organisator-Login</a>
    </footer>

    <CreateGameModal createPath="/games" />
  </Layout>
)
