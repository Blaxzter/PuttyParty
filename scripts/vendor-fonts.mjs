// Vendors the Google Fonts used by the app into public/fonts/ + public/fonts.css
// so the running site makes NO request to Google (GDPR: no visitor IP leaves to
// a third party) and is faster. Re-run after changing the font set below.
//
//   node scripts/vendor-fonts.mjs
import { Buffer } from 'node:buffer'
import { mkdir, writeFile } from 'node:fs/promises'

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Anton&family=Roboto+Mono:wght@400;500;600&display=swap'
// A desktop-Chrome UA makes the css2 endpoint return modern woff2 sources.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
// DE + EN only need Latin; skip cyrillic/greek/vietnamese to keep the repo lean.
const ALLOWED = new Set(['latin', 'latin-ext'])
const OUT_DIR = new URL('../public/fonts/', import.meta.url)

const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } })
if (!res.ok) throw new Error(`Google Fonts CSS fetch failed: ${res.status}`)
const css = await res.text()

await mkdir(OUT_DIR, { recursive: true })

const blockRe = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{[^}]*\}/g
const downloads = new Map() // gstatic url -> local filename
const faces = []
for (const match of css.matchAll(blockRe)) {
  const subset = match[1]
  if (!ALLOWED.has(subset)) continue
  const urlMatch = match[0].match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+\.woff2/)
  if (!urlMatch) continue
  const url = urlMatch[0]
  const name = url.split('/').pop()
  downloads.set(url, name)
  faces.push(match[0].replace(url, `/fonts/${name}`))
}

for (const [url, name] of downloads) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`font download failed (${r.status}): ${url}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await writeFile(new URL(name, OUT_DIR), buf)
  console.log('saved', name, `${buf.length} bytes`)
}

const header =
  '/* Self-hosted from Google Fonts — no third-party requests at runtime.\n' +
  '   Regenerate with: node scripts/vendor-fonts.mjs */\n'
await writeFile(new URL('../public/fonts.css', import.meta.url), `${header + faces.join('\n')}\n`)
console.log(`\nwrote public/fonts.css with ${faces.length} @font-face rules`)
