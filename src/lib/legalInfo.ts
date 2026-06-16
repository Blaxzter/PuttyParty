import type { Env } from '../bindings'

// Operator details for the Impressum / Datenschutz pages, read at runtime from
// env (Worker vars / secrets, or .dev.vars locally) so the real name/address
// never live in the public git repo. Mirrors the logoviewer project's
// VITE_LEGAL_* approach, adapted to Cloudflare Workers' c.env.
//
// IMPORTANT: an Impressum must be PUBLICLY VISIBLE, so these values still appear
// on the deployed /impressum page — this only keeps them out of the source repo,
// it is not a place for true secrets. When unset, [PLACEHOLDER] fallbacks render
// and `complete` is false (the draft notice stays visible).

export interface LegalInfo {
  name: string
  street: string
  city: string
  country: string
  email: string
  /** Optional — the phone line is omitted when empty. */
  phone: string
  /** True once the essential fields are provided (hides the draft notice). */
  complete: boolean
}

export function getLegalInfo(env: Env): LegalInfo {
  return {
    name: env.LEGAL_NAME || '[VOLLER NAME / FULL NAME]',
    street: env.LEGAL_STREET || '[STRASSE & NR / STREET & NO.]',
    city: env.LEGAL_CITY || '[PLZ ORT / POSTCODE CITY]',
    country: env.LEGAL_COUNTRY || 'Germany',
    email: env.LEGAL_EMAIL || '[E-MAIL]',
    phone: env.LEGAL_PHONE || '',
    complete: Boolean(env.LEGAL_NAME && env.LEGAL_STREET && env.LEGAL_CITY && env.LEGAL_EMAIL),
  }
}

/**
 * Fills {{TOKEN}} placeholders in a raw HTML string (the generated Datenschutz)
 * with the operator details, so the personal data never lives in the committed
 * file. Supported: {{NAME}} {{STREET}} {{CITY}} {{COUNTRY}} {{EMAIL}} {{PHONE}}.
 */
export function fillLegalTokens(html: string, info: LegalInfo): string {
  const tokens: Record<string, string> = {
    NAME: info.name,
    STREET: info.street,
    CITY: info.city,
    COUNTRY: info.country,
    EMAIL: info.email,
    PHONE: info.phone,
  }
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match)
}
