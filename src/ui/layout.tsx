import { raw } from 'hono/html'
import type { Child, FC } from 'hono/jsx'
import { LOCALE_TAG, LOCALES, useI18n } from '../i18n'

export interface LayoutProps {
  title: string
  bodyClass?: string
  /** Load the vendored htmx bundle. */
  htmx?: boolean
  /** Module scripts appended before </body>, e.g. ['/board.js']. */
  scripts?: string[]
  /** Extra nodes for <head>. */
  head?: Child
  /**
   * Marketing/legal pages opt into rich social cards + indexing by passing a
   * description. Game pages (opaque capability URLs) omit it and are noindex'd.
   */
  description?: string
  /** Emit Open Graph / Twitter cards, canonical + hreflang. Marketing pages only. */
  social?: boolean
  children?: Child
}

/** Open Graph + Twitter + canonical + hreflang for the indexable marketing pages. */
const SocialMeta: FC<{ title: string; description: string }> = ({ title, description }) => {
  const { locale, path, origin } = useI18n()
  const canonical = `${origin}${path}`
  const ogImage = `${origin}/img/og${locale === 'en' ? '-en' : ''}.png`
  return (
    <>
      <link rel="canonical" href={canonical} />
      {LOCALES.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={`${canonical}?lang=${l}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Putt Party" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={LOCALE_TAG[locale]} />
      {LOCALES.filter((l) => l !== locale).map((l) => (
        <meta key={l} property="og:locale:alternate" content={LOCALE_TAG[l]} />
      ))}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  )
}

export const Layout: FC<LayoutProps> = (props) => {
  const { locale } = useI18n()
  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang={locale}>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{props.title}</title>
          {props.description ? <meta name="description" content={props.description} /> : null}
          <meta name="robots" content={props.social ? 'index,follow' : 'noindex,follow'} />
          {props.social && props.description ? (
            <SocialMeta title={props.title} description={props.description} />
          ) : null}
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          {/* Self-hosted fonts (no third-party request). See scripts/vendor-fonts.mjs. */}
          <link rel="stylesheet" href="/fonts.css" />
          <link rel="stylesheet" href="/app.css" />
          {props.htmx ? <script src="/htmx.min.js" defer /> : null}
          {props.head}
        </head>
        <body class={props.bodyClass}>
          {props.children}
          {props.scripts?.map((src) => (
            <script key={src} type="module" src={src} />
          ))}
        </body>
      </html>
    </>
  )
}
