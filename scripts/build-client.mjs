// Bundles the browser-side TypeScript in src/client/* into public/*.js (esbuild)
// and vendors htmx so everything is self-hosted (no CDN at runtime).
// Run automatically by `npm run dev` / `npm run deploy`.
import { copyFile } from 'node:fs/promises'
import { build } from 'esbuild'

const entries = ['board', 'entry', 'admin']

await build({
  entryPoints: entries.map((name) => `src/client/${name}.ts`),
  outdir: 'public',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: false,
  logLevel: 'info',
})

await copyFile('node_modules/htmx.org/dist/htmx.min.js', 'public/htmx.min.js')

console.log(
  `Built ${entries.map((e) => `public/${e}.js`).join(', ')} + vendored public/htmx.min.js`,
)
