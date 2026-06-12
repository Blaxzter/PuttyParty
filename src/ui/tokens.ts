// Design tokens lifted from Putt Party.dc.html. The canonical source for styling
// is the CSS custom properties in public/app.css; these constants mirror them for
// the few places that need inline-style values (icons, confetti, podium accents).

export const colors = {
  pageBg: '#E5E1D5',
  cream: '#F6F1E6',
  card: '#FFFDF8',
  adminCanvas: '#F1ECE0',
  panelHead: '#FBF8F0',

  turfFrom: '#2E8B57',
  turfTo: '#14442F',
  flag: '#E2533B',
  flagPress: '#b73c28',
  sunny: '#F2C14E',
  ink: '#16261F',

  gold: '#D8A72B',
  silver: '#9AA3A0',
  bronze: '#C0824E',

  text: '#16261F',
  textMuted: '#44524a',
  textSoft: '#6B7B6E',
  textFaint: '#8a9488',
  greenText: '#1d6b43',
  redText: '#b3402b',

  borderCream: '#e6dec9',
  borderInput: '#e0d8c2',
} as const

export const fonts = {
  head: "'Baloo 2', system-ui, sans-serif",
  score: "'Anton', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'Roboto Mono', ui-monospace, monospace",
} as const

/** Medal colour for a podium/rank position (1-based); falls back to muted ink. */
export function medalColor(rank: number): string {
  if (rank === 1) return colors.gold
  if (rank === 2) return colors.silver
  if (rank === 3) return colors.bronze
  return '#44524a'
}
