import { type Child, createContext, useContext } from 'hono/jsx'
import { de } from './de'
import { en } from './en'
import { DEFAULT_LOCALE, type Locale } from './locale'
import type { Dictionary } from './types'

export type { Locale } from './locale'
export { isLocale, LOCALE_LABEL, LOCALE_TAG, LOCALES } from './locale'
export type { Dictionary } from './types'

const DICTS: Record<Locale, Dictionary> = { de, en }

export function getDictionary(locale: Locale): Dictionary {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE]
}

/** Per-request i18n state, provided via context to the whole render tree. */
export interface I18n {
  locale: Locale
  t: Dictionary
  /** Request path without query — the switcher + hreflang links rebuild URLs from it. */
  path: string
  /** Absolute site origin (no trailing slash) for canonical / OG / hreflang URLs. */
  origin: string
}

const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: de,
  path: '/',
  origin: '',
})

/** Read the active locale + dictionary inside any component. */
export function useI18n(): I18n {
  return useContext(I18nContext)
}

/** Convenience: just the dictionary. */
export function useT(): Dictionary {
  return useContext(I18nContext).t
}

export const I18nProvider = ({ value, children }: { value: I18n; children?: Child }) => (
  <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
)
