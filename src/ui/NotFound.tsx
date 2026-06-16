import type { FC } from 'hono/jsx'
import { useT } from '../i18n'
import { Layout } from './layout'
import { BrandBadge } from './primitives'

export const NotFoundPage: FC<{ message?: string }> = ({ message }) => {
  const t = useT()
  return (
    <Layout title={t.meta.notFoundTitle} bodyClass="pp-body--entry">
      <div class="pp-screen" style="max-width:420px;text-align:center;padding:44px 28px">
        <div style="display:flex;justify-content:center;margin-bottom:18px">
          <BrandBadge size={52} withBall />
        </div>
        <h1
          class="pp-h"
          style="margin:0 0 8px;font-weight:800;font-size:24px;color:var(--pp-turf-to)"
        >
          {t.notFound.title}
        </h1>
        <p style="margin:0;font-family:var(--font-body);font-size:14px;color:var(--pp-text-soft);line-height:1.5">
          {message ?? t.notFound.body}
        </p>
      </div>
    </Layout>
  )
}
