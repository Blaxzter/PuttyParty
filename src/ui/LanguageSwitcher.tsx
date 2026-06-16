import type { FC } from 'hono/jsx'
import { Fragment } from 'hono/jsx'
import { LOCALES, useI18n } from '../i18n'

/**
 * Compact DE · EN toggle. Each option links to the current path with ?lang=,
 * which the i18n middleware honours and persists to a cookie. Self-contained
 * inline styles so it can drop into any chrome (landing nav, footer, …).
 */
export const LanguageSwitcher: FC<{ tone?: 'light' | 'dark' }> = ({ tone = 'dark' }) => {
  const { locale, path, t } = useI18n()
  const base = tone === 'light' ? 'rgba(255,253,248,.6)' : 'var(--pp-text-soft, #6B7B6E)'
  const active = tone === 'light' ? '#FFFDF8' : 'var(--pp-turf-to, #14442F)'
  return (
    <nav
      aria-label={t.common.chooseLanguage}
      style="display:inline-flex;align-items:center;gap:6px;font-family:var(--font-head);font-weight:700;font-size:13px;letter-spacing:.04em"
    >
      {LOCALES.map((l, i) => (
        <Fragment key={l}>
          {i > 0 ? <span style={`color:${base};opacity:.5`}>·</span> : null}
          {l === locale ? (
            <span aria-current="true" style={`color:${active}`}>
              {l.toUpperCase()}
            </span>
          ) : (
            <a href={`${path}?lang=${l}`} hreflang={l} style={`color:${base};text-decoration:none`}>
              {l.toUpperCase()}
            </a>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
