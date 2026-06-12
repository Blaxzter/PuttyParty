// Public copy is German. Games store dates as ISO (YYYY-MM-DD); the UI shows
// short (DD.MM.YYYY) and long (28. Juni 2026) German forms.

const MONTHS_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const DE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/

function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** "2026-06-28" -> "28.06.2026" (or "" if invalid). */
export function isoToGerman(iso: string): string {
  const m = ISO_RE.exec(iso)
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

/** "28.06.2026" -> "2026-06-28", or null if not a real date. */
export function germanToIso(de: string): string | null {
  const m = DE_RE.exec(de.trim())
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (!isRealDate(year, month, day)) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** "2026-06-28" -> "28. Juni 2026" (falls back to the raw string if invalid). */
export function formatGermanLong(iso: string): string {
  const m = ISO_RE.exec(iso)
  if (!m) return iso
  const day = Number(m[3])
  const month = Number(m[2])
  const monthName = MONTHS_DE[month - 1]
  if (!monthName) return iso
  return `${day}. ${monthName} ${m[1]}`
}
