// Bundles the browser-side TypeScript in src/client/* into public/*.js
// (esbuild, no typecheck — `npm run typecheck` covers types separately).
// Run automatically by `npm run dev` / `npm run deploy`.
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

console.log(`Built client bundles: ${entries.map((e) => `public/${e}.js`).join(', ')}`)
