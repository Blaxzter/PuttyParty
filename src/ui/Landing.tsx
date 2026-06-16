import type { FC } from 'hono/jsx'
import { useI18n } from '../i18n'
import { CreateGameModal } from './admin/GameForm'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Layout } from './layout'
import { BrandBadge } from './primitives'

export const LandingPage: FC<{ baseUrl: string; turnstileSiteKey?: string }> = ({
  turnstileSiteKey,
}) => {
  const { t, locale } = useI18n()
  // Localised marketing screenshots (English UI for /en visitors).
  const shot = (name: string) => `/img/${name}${locale === 'en' ? '-en' : ''}.png`
  return (
    <Layout
      title={t.meta.landingTitle}
      description={t.meta.landingDescription}
      social
      bodyClass="pp-body--landing"
      htmx
      scripts={['/admin.js']}
      head={
        turnstileSiteKey ? (
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        ) : null
      }
    >
      <header class="pp-landing-nav">
        <div class="pp-landing-brand">
          <BrandBadge size={40} withBall />
          {t.common.brand}
        </div>
        <div style="display:flex;align-items:center;gap:18px">
          <LanguageSwitcher />
          <a class="pp-login" href="/admin">
            {t.common.organiserLogin}
          </a>
        </div>
      </header>

      <section class="pp-hero">
        <div class="pp-hero-inner">
          <div>
            <h1>
              {t.landing.heroTitleLine1}
              <br />
              {t.landing.heroTitleLine2}
            </h1>
            <p>{t.landing.heroLead}</p>
            <div class="pp-cta-row">
              <button
                type="button"
                class="pp-btn pp-btn--primary pp-btn--lg"
                data-open-modal="pp-create-modal"
              >
                {t.landing.ctaCreate}
              </button>
              <a href="#so" class="pp-btn pp-btn--gold pp-btn--lg">
                {t.landing.ctaHow}
              </a>
            </div>
          </div>
          <div class="pp-hero-shot">
            <img src={shot('board')} alt={t.landing.heroImgAlt} />
          </div>
        </div>
      </section>

      <section id="so" class="pp-section">
        <h2>{t.landing.howTitle}</h2>
        <p class="pp-lead">{t.landing.howLead}</p>
        <div class="pp-steps">
          {t.landing.steps.map((s, i) => (
            <div class="pp-step" key={s.title}>
              <span class="num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section class="pp-section" style="padding-top:0">
        <div class="pp-feature">
          <div class="pp-feature-img">
            <img src={shot('entry')} alt={t.landing.feature1Alt} />
          </div>
          <div>
            <h3>{t.landing.feature1Title}</h3>
            <p>{t.landing.feature1Body}</p>
          </div>
        </div>
        <div class="pp-feature">
          <div>
            <h3>{t.landing.feature2Title}</h3>
            <p>{t.landing.feature2Body}</p>
          </div>
          <div class="pp-feature-img">
            <img src={shot('board')} alt={t.landing.feature2Alt} />
          </div>
        </div>
      </section>

      <section class="pp-cta-band">
        <div class="pp-cta-band-inner">
          <h2>{t.landing.ctaBandTitle}</h2>
          <button
            type="button"
            class="pp-btn pp-btn--gold pp-btn--lg"
            data-open-modal="pp-create-modal"
          >
            {t.landing.ctaBandButton}
          </button>
        </div>
      </section>

      <footer class="pp-landing-foot">
        <BrandBadge size={22} />
        {t.common.brand} · {t.footer.tagline}
        <span style="margin:0 4px">·</span>
        <a href="/impressum">{t.footer.imprint}</a>
        <span style="margin:0 4px">·</span>
        <a href="/datenschutz">{t.footer.privacy}</a>
        <span style="margin:0 4px">·</span>
        <a href="/admin">{t.common.organiserLogin}</a>
        <span style="margin:0 8px">·</span>
        <LanguageSwitcher />
      </footer>

      <CreateGameModal createPath="/games" turnstileSiteKey={turnstileSiteKey} />
    </Layout>
  )
}
