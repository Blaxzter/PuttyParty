import type { Context } from 'hono'
import type { Child } from 'hono/jsx'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppEnv } from '../bindings'
import { getDictionary, I18nProvider } from './index'
import type { Locale } from './locale'

/**
 * Renders a JSX tree as the response with the request's locale provided via
 * context. Works for both full pages and htmx partials (the provider emits no
 * markup of its own), so every fragment swap stays in the visitor's language.
 */
export function page(c: Context<AppEnv>, node: Child, status?: ContentfulStatusCode) {
  const body = <I18nProvider value={c.var.i18n}>{node}</I18nProvider>
  return status === undefined ? c.html(body) : c.html(body, status)
}

/**
 * Like page(), but forces a specific locale regardless of the visitor's. Used by
 * the in-game surfaces (entry + board): a game has a fixed language chosen at
 * creation, so everyone in that event sees the same copy.
 */
export function pageLocale(
  c: Context<AppEnv>,
  node: Child,
  locale: Locale,
  status?: ContentfulStatusCode,
) {
  const i18n = { ...c.var.i18n, locale, t: getDictionary(locale) }
  const body = <I18nProvider value={i18n}>{node}</I18nProvider>
  return status === undefined ? c.html(body) : c.html(body, status)
}
