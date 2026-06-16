// Cloudflare Turnstile server-side verification for the open (unauthenticated)
// game-creation form. Fails closed: a missing/invalid token or an unreachable
// siteverify endpoint is treated as "not human".
//
// Enforcement is OPT-IN: it only runs when TURNSTILE_SECRET_KEY is configured, so
// local dev (and any deploy that hasn't set up Turnstile yet) keeps working.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface SiteverifyResponse {
  success?: boolean
}

export async function verifyTurnstile(
  secret: string,
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false
  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return false
    const data = (await res.json()) as SiteverifyResponse
    return data.success === true
  } catch {
    return false
  }
}
