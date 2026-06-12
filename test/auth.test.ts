import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import type { AppEnv, Env } from '../src/bindings'
import { verifyAccessToken } from '../src/lib/access'
import { requireAdmin } from '../src/middleware/requireAdmin'

function adminApp() {
  const app = new Hono<AppEnv>()
  app.use('/admin/*', requireAdmin)
  app.get('/admin/ping', (c) => c.json({ ok: true, admin: c.get('admin') }))
  return app
}

const env = (overrides: Partial<Env>): Env =>
  ({
    ACCESS_TEAM_DOMAIN: 'team.example.com',
    ACCESS_AUD: 'aud-123',
    DEV_ADMIN_BYPASS: 'false',
    ...overrides,
  }) as Env

describe('requireAdmin guard', () => {
  it('returns 403 when no Access token is present', async () => {
    const res = await adminApp().request('/admin/ping', {}, env({}))
    expect(res.status).toBe(403)
  })

  it('returns 403 for a malformed/invalid token', async () => {
    const res = await adminApp().request(
      '/admin/ping',
      { headers: { 'cf-access-jwt-assertion': 'not.a.real.jwt' } },
      env({}),
    )
    expect(res.status).toBe(403)
  })

  it('returns 403 when Access is unconfigured', async () => {
    const res = await adminApp().request(
      '/admin/ping',
      {},
      env({ ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' }),
    )
    expect(res.status).toBe(403)
  })

  it('allows the dev bypass only when Access is unconfigured', async () => {
    const res = await adminApp().request(
      '/admin/ping',
      {},
      env({ ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '', DEV_ADMIN_BYPASS: 'true' }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { admin: { name: string } }
    expect(body.admin.name).toBe('Dev Admin')
  })

  it('ignores the dev bypass when Access IS configured (fail closed)', async () => {
    // bypass on, but Access configured -> must still require a valid JWT
    const res = await adminApp().request('/admin/ping', {}, env({ DEV_ADMIN_BYPASS: 'true' }))
    expect(res.status).toBe(403)
  })
})

async function makeKeySetAndSigner() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true })
  const jwk = await exportJWK(publicKey)
  jwk.kid = 'test-key'
  jwk.alg = 'RS256'
  const keySet = createLocalJWKSet({ keys: [jwk] })
  return { keySet, privateKey }
}

describe('verifyAccessToken', () => {
  it('accepts a correctly signed token and extracts identity', async () => {
    const { keySet, privateKey } = await makeKeySetAndSigner()
    const token = await new SignJWT({ email: 'a.keller@example.com', name: 'A. Keller' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer('https://team.example.com')
      .setAudience('aud-123')
      .setExpirationTime('1h')
      .sign(privateKey)
    const id = await verifyAccessToken(token, keySet, {
      issuer: 'https://team.example.com',
      audience: 'aud-123',
    })
    expect(id.email).toBe('a.keller@example.com')
    expect(id.name).toBe('A. Keller')
  })

  it('rejects a token with the wrong audience', async () => {
    const { keySet, privateKey } = await makeKeySetAndSigner()
    const token = await new SignJWT({ email: 'x@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer('https://team.example.com')
      .setAudience('WRONG-AUD')
      .setExpirationTime('1h')
      .sign(privateKey)
    await expect(
      verifyAccessToken(token, keySet, {
        issuer: 'https://team.example.com',
        audience: 'aud-123',
      }),
    ).rejects.toBeTruthy()
  })

  it('rejects an expired token', async () => {
    const { keySet, privateKey } = await makeKeySetAndSigner()
    const token = await new SignJWT({ email: 'x@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer('https://team.example.com')
      .setAudience('aud-123')
      .setExpirationTime('-1h')
      .sign(privateKey)
    await expect(
      verifyAccessToken(token, keySet, {
        issuer: 'https://team.example.com',
        audience: 'aud-123',
      }),
    ).rejects.toBeTruthy()
  })
})
