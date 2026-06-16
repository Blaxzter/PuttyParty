// Locale set + negotiation. Pure logic (no JSX) so it can be imported anywhere,
// including the Durable Object and client bundles.

export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Public copy was originally German; it stays the default for back-compat. */
export const DEFAULT_LOCALE: Locale = 'de'

/** Persisted language choice (set when a visitor uses the switcher / ?lang=). */
export const LOCALE_COOKIE = 'pp_lang'
/** One year — a language preference is long-lived. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Human label for each locale (shown in the switcher). */
export const LOCALE_LABEL: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
}

/** BCP-47 tag for <html lang> / og:locale. */
export const LOCALE_TAG: Record<Locale, string> = {
  de: 'de_DE',
  en: 'en',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Picks the best supported locale from an Accept-Language header, honouring the
 * client's quality weighting. Returns null when nothing matches.
 */
export function fromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      const quality = q ? Number.parseFloat(q.split('=')[1] ?? '1') : 1
      // Match on the primary subtag only ("en-GB" -> "en").
      const primary = tag.trim().toLowerCase().split('-')[0]
      return { primary, quality: Number.isFinite(quality) ? quality : 1 }
    })
    .filter((r) => r.primary)
    .sort((a, b) => b.quality - a.quality)
  for (const { primary } of ranked) {
    if (isLocale(primary)) return primary
  }
  return null
}
