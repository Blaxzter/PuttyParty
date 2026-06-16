import type { MiddlewareHandler } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from '../bindings'
import { getDictionary } from '../i18n'
import {
  DEFAULT_LOCALE,
  fromAcceptLanguage,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from '../i18n/locale'

// Resolves the site locale for every request and exposes it as c.var.i18n.
// Precedence: explicit ?lang= (also persisted) > saved cookie > Accept-Language > default.
export const i18nMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const queryLang = c.req.query('lang')
  let locale: Locale
  let persist = false

  if (isLocale(queryLang)) {
    locale = queryLang
    persist = true
  } else {
    const cookie = getCookie(c, LOCALE_COOKIE)
    locale = isLocale(cookie)
      ? cookie
      : (fromAcceptLanguage(c.req.header('accept-language')) ?? DEFAULT_LOCALE)
  }

  if (persist) {
    setCookie(c, LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'Lax',
      httpOnly: true,
    })
  }

  const origin = (c.env.APP_BASE_URL ?? '').replace(/\/$/, '')
  c.set('i18n', { locale, t: getDictionary(locale), path: c.req.path, origin })
  await next()
}
