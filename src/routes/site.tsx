import { Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import { createGame, getDb } from '../db/queries'
import { page } from '../i18n/render'
import { newManageId, newPublicId } from '../lib/ids'
import { getLegalInfo } from '../lib/legalInfo'
import { verifyTurnstile } from '../lib/turnstile'
import { fieldErrors, makeGameSchema } from '../lib/validation'
import { GameFormBody } from '../ui/admin/GameForm'
import { LandingPage } from '../ui/Landing'
import { ImprintPage, PrivacyPage } from '../ui/Legal'
import { draftFromBody } from './manageActions'

// Public marketing landing + open (unauthenticated) self-service game creation.
export const siteRoutes = new Hono<AppEnv>()

const baseUrl = (env: Env): string => env.APP_BASE_URL.replace(/\/$/, '')

siteRoutes.get('/', (c) =>
  page(c, <LandingPage baseUrl={baseUrl(c.env)} turnstileSiteKey={c.env.TURNSTILE_SITE_KEY} />),
)

// Legal pages (required for a public launch in DE/EU).
siteRoutes.get('/impressum', (c) => page(c, <ImprintPage info={getLegalInfo(c.env)} />))
siteRoutes.get('/datenschutz', (c) => page(c, <PrivacyPage info={getLegalInfo(c.env)} />))

// SEO: index the marketing/legal pages; keep opaque game/manage/admin URLs out.
siteRoutes.get('/robots.txt', (c) =>
  c.text(
    `User-agent: *\nDisallow: /g/\nDisallow: /m/\nDisallow: /admin\n\nSitemap: ${baseUrl(c.env)}/sitemap.xml\n`,
  ),
)

siteRoutes.get('/sitemap.xml', (c) => {
  const origin = baseUrl(c.env)
  const paths = ['/', '/impressum', '/datenschutz']
  const urls = paths
    .map((p) => {
      const loc = `${origin}${p}`
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <xhtml:link rel="alternate" hreflang="de" href="${loc}?lang=de"/>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

siteRoutes.post('/games', async (c) => {
  const siteKey = c.env.TURNSTILE_SITE_KEY
  const body = await c.req.parseBody()
  const parsed = makeGameSchema(c.var.i18n.t).safeParse(body)
  if (!parsed.success) {
    return page(
      c,
      <GameFormBody
        mode="create"
        createPath="/games"
        values={draftFromBody(body)}
        errors={fieldErrors(parsed.error)}
        turnstileSiteKey={siteKey}
      />,
    )
  }
  // Spam protection — enforced only when a Turnstile secret is configured.
  if (c.env.TURNSTILE_SECRET_KEY) {
    const token =
      typeof body['cf-turnstile-response'] === 'string' ? body['cf-turnstile-response'] : undefined
    const human = await verifyTurnstile(
      c.env.TURNSTILE_SECRET_KEY,
      token,
      c.req.header('cf-connecting-ip') ?? undefined,
    )
    if (!human) {
      return page(
        c,
        <GameFormBody
          mode="create"
          createPath="/games"
          values={draftFromBody(body)}
          turnstileSiteKey={siteKey}
          alert={c.var.i18n.t.gameForm.turnstileFailed}
        />,
      )
    }
  }
  const manageId = newManageId()
  await createGame(getDb(c.env), {
    publicId: newPublicId(),
    manageId,
    name: parsed.data.name,
    date: parsed.data.date,
    location: parsed.data.location,
    holes: parsed.data.holes,
    entryMode: parsed.data.entryMode,
    teamsEnabled: parsed.data.teamsEnabled,
    status: parsed.data.status,
    // Default the game's language to the creator's current site locale.
    locale: parsed.data.locale ?? c.var.i18n.locale,
  })
  // Send the creator to their secret manage URL.
  c.header('HX-Redirect', `/m/${manageId}`)
  return c.body(null, 200)
})
