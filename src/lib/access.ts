import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from 'jose'
import type { AdminIdentity, Env } from '../bindings'

// Verifies the Cloudflare Access JWT (Cf-Access-Jwt-Assertion header / CF_Authorization
// cookie) against the team JWKS, checking signature, issuer and audience.

export interface AccessVerifyOptions {
  issuer: string
  audience: string
}

/** Low-level verify against any key set — used directly by tests with a local JWKS. */
export async function verifyAccessToken(
  token: string,
  keySet: JWTVerifyGetKey,
  opts: AccessVerifyOptions,
): Promise<AdminIdentity> {
  const { payload } = await jwtVerify(token, keySet, {
    issuer: opts.issuer,
    audience: opts.audience,
    algorithms: ['RS256'],
  })
  const email = typeof payload.email === 'string' ? payload.email : undefined
  const custom = payload.custom as { name?: unknown } | undefined
  const nameClaim =
    typeof payload.name === 'string'
      ? payload.name
      : typeof custom?.name === 'string'
        ? custom.name
        : undefined
  const resolvedEmail = email ?? (typeof payload.sub === 'string' ? payload.sub : 'unbekannt')
  return { email: resolvedEmail, name: nameClaim ?? resolvedEmail }
}

// Cache one remote key set per team domain (per isolate).
let cached: { url: string; keySet: ReturnType<typeof createRemoteJWKSet> } | null = null

function remoteKeySet(teamDomain: string): ReturnType<typeof createRemoteJWKSet> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`
  if (!cached || cached.url !== url) {
    cached = { url, keySet: createRemoteJWKSet(new URL(url)) }
  }
  return cached.keySet
}

/** Verifies an Access token using the configured team JWKS. Throws on any failure. */
export async function verifyAccessJwt(token: string, env: Env): Promise<AdminIdentity> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    throw new Error('Access not configured: ACCESS_TEAM_DOMAIN / ACCESS_AUD missing')
  }
  return verifyAccessToken(token, remoteKeySet(env.ACCESS_TEAM_DOMAIN), {
    issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
    audience: env.ACCESS_AUD,
  })
}
