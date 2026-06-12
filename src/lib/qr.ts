import encodeQR from '@paulmillr/qr'

export interface QrOptions {
  /** Pixel size of one module in the SVG's coordinate space. */
  module?: number
  /** Quiet-zone width in modules (QR spec recommends ≥4). */
  quiet?: number
  /** Dark module colour. */
  dark?: string
  /** Background colour. */
  light?: string
}

/**
 * Renders `text` as a scannable QR code SVG. We draw modules ourselves (from the
 * raw matrix) so colours/quiet-zone match the design (ink on cream) and the SVG
 * scales cleanly to any container via its viewBox.
 */
export function qrSvg(text: string, opts: QrOptions = {}): string {
  const module = opts.module ?? 4
  const quiet = opts.quiet ?? 4
  const dark = opts.dark ?? '#16261F'
  const light = opts.light ?? '#FFFDF8'

  const matrix = encodeQR(text, 'raw', { ecc: 'medium', border: 0 })
  const n = matrix.length
  const size = (n + quiet * 2) * module

  let path = ''
  for (let y = 0; y < n; y++) {
    const row = matrix[y]!
    for (let x = 0; x < n; x++) {
      if (row[x]) {
        const px = (x + quiet) * module
        const py = (y + quiet) * module
        path += `M${px} ${py}h${module}v${module}h-${module}z`
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ` +
    `shape-rendering="crispEdges" role="img" aria-label="QR-Code">` +
    `<rect width="${size}" height="${size}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/>` +
    `</svg>`
  )
}
