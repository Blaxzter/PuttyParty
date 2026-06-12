import type { FC } from 'hono/jsx'
import { Layout } from './layout'
import { BrandBadge } from './primitives'

export const NotFoundPage: FC<{ message?: string }> = ({ message }) => (
  <Layout title="Nicht gefunden · Putt Party" bodyClass="pp-body--entry">
    <div class="pp-screen" style="max-width:420px;text-align:center;padding:44px 28px">
      <div style="display:flex;justify-content:center;margin-bottom:18px">
        <BrandBadge size={52} withBall />
      </div>
      <h1
        class="pp-h"
        style="margin:0 0 8px;font-weight:800;font-size:24px;color:var(--pp-turf-to)"
      >
        Nicht gefunden
      </h1>
      <p style="margin:0;font-family:var(--font-body);font-size:14px;color:var(--pp-text-soft);line-height:1.5">
        {message ?? 'Dieses Spiel gibt es nicht (mehr). Prüfe den Link oder QR-Code.'}
      </p>
    </div>
  </Layout>
)
